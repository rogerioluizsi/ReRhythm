from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.database import get_db
from app.models import User, JournalEntry, Conversation
from app.schemas import (
    StartCounselingRequest, StartCounselingResponse,
    FollowUpRequest, FollowUpResponse
)
from app.utils.llm_utils import structured_response

router = APIRouter(prefix="/counseling", tags=["Journaling Counseling"])

SYSTEM_PROMPT = """You are a supportive psychological counselor helping a user reflect on their journal entries in a live chat conversation.

CRITICAL RULES:
- NEVER use the user's name or any identifying information
- NEVER reference specific dates, locations, or people mentioned in journals
- Address the user as "you" only
- Be warm, empathetic, and supportive
- Provide gentle psychological support and insights
- Ask thoughtful follow-up questions when appropriate
- Keep responses concise but meaningful
- use markdown formatting for better readability

Your role is to help the user process their thoughts and feelings based on their journal entries."""

CHAT_STYLE_PROMPT = """You are responding inside an active, back-and-forth chat with someone under stress. Keep every reply under 80 words, use two short paragraphs (blank line between), and end with one gentle, open question. Keep language simple, validating, and focused on immediate emotional grounding or coping micro-actions."""


@router.post("/start", response_model=StartCounselingResponse)
def start_counseling(request: StartCounselingRequest, db: Session = Depends(get_db)):
    """
    Start a new counseling conversation based on user's journal entries.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all journal entries for the user
    journals = db.query(JournalEntry)\
        .filter(JournalEntry.user_id == request.user_id)\
        .order_by(JournalEntry.created_at.desc())\
        .all()
    
    if not journals:
        raise HTTPException(status_code=404, detail="No journal entries found")
    
    # Prepare journal summaries (without dates or identifying info)
    journal_texts = [j.journal_description for j in journals]
    journals_context = "\n---\n".join(journal_texts)
    
    # Build initial message
    user_message = f"""Here are the user's journal entries for context:

{journals_context}

Please provide an initial live-chat counseling reply (max 80 words, two short paragraphs) based on these journal entries. Remember to never use names or identifying information."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": CHAT_STYLE_PROMPT},
        {"role": "user", "content": user_message}
    ]
    
    # Define the response schema for structured output
    response_schema = {
        "type": "object",
        "properties": {
            "counseling": {
                "type": "string",
                "description": "The supportive counseling response in markdown format"
            }
        },
        "required": ["counseling"],
        "additionalProperties": False
    }
    
    try:
        # Get LLM response
        result = structured_response(
            messages=messages,
            schema=response_schema,
            schema_name="counseling_response"
        )
        counseling = result["counseling"]
        
        # Save conversation
        conversation = Conversation(
            user_id=request.user_id,
            messages=json.dumps(messages + [{"role": "assistant", "content": counseling}]),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        return StartCounselingResponse(
            conversation_id=conversation.id,
            counseling=counseling
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/followup", response_model=FollowUpResponse)
def followup_counseling(request: FollowUpRequest, db: Session = Depends(get_db)):
    """
    Continue an existing counseling conversation.
    """
    # Get conversation
    conversation = db.query(Conversation)\
        .filter(Conversation.id == request.conversation_id)\
        .first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Load previous messages
    messages = json.loads(conversation.messages)

    # Ensure chat-style instructions exist once for ongoing conversations
    if not any(
        msg.get("role") == "system" and msg.get("content") == CHAT_STYLE_PROMPT
        for msg in messages
    ):
        messages.insert(1, {"role": "system", "content": CHAT_STYLE_PROMPT})

    # Add new user message
    messages.append({"role": "user", "content": request.message})
    
    # Define the response schema for structured output
    response_schema = {
        "type": "object",
        "properties": {
            "counseling": {
                "type": "string",
                "description": "The supportive counseling response"
            }
        },
        "required": ["counseling"],
        "additionalProperties": False
    }
    
    try:
        # Get LLM response
        result = structured_response(
            messages=messages,
            schema=response_schema,
            schema_name="counseling_response"
        )
        counseling = result["counseling"]
        
        # Update conversation with new messages
        messages.append({"role": "assistant", "content": counseling})
        conversation.messages = json.dumps(messages)
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        return FollowUpResponse(counseling=counseling)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

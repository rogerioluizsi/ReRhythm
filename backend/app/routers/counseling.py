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

SYSTEM_PROMPT = """You are a supportive psychological counselor helping a user in a live chat conversation.

CRITICAL RULES:
- NEVER use the user's name or any identifying information
- NEVER reference specific dates, locations, or people mentioned
- Address the user as "you" only
- Be warm, empathetic, and supportive
- Provide gentle psychological support and insights
- Ask thoughtful follow-up questions when appropriate
- Keep responses concise but meaningful
- use markdown formatting for better readability

Your role is to help the user process their thoughts and feelings, whether they're reflecting on journal entries or just seeking general support."""

CHAT_STYLE_PROMPT = """You are responding inside an active, back-and-forth chat with someone who may be under stress. Keep every reply under 80 words, use two short paragraphs (blank line between), and end with one gentle, open question. Keep language simple, validating, and focused on immediate emotional grounding or coping micro-actions."""


@router.post("/start", response_model=StartCounselingResponse)
def start_counseling(request: StartCounselingRequest, db: Session = Depends(get_db)):
    """
    Start a new counseling conversation. Can be based on journal entries or general support.
    If journal_entry_ids is provided, only those entries are used for context.
    If journal_entry_ids is None or empty, no journal context is included.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get selected journal entries if IDs are provided
    journals = []
    if request.journal_entry_ids:
        journals = db.query(JournalEntry)\
            .filter(
                JournalEntry.user_id == request.user_id,
                JournalEntry.id.in_(request.journal_entry_ids)
            )\
            .order_by(JournalEntry.created_at.desc())\
            .all()
    
    # Build initial message based on whether journals were selected
    if journals:
        # Prepare journal summaries (without dates or identifying info)
        journal_texts = [j.journal_description for j in journals]
        journals_context = "\n---\n".join(journal_texts)
        
        user_message = f"""Here are the user's journal entries for context:

{journals_context}

Please provide an initial live-chat counseling reply (max 80 words, two short paragraphs) based on these journal entries. Remember to never use names or identifying information."""
    else:
        # No journals - offer general support
        user_message = """The user has just opened a support chat. They haven't written any journal entries yet. Please provide a warm, welcoming initial message (max 80 words, two short paragraphs) that:
- Introduces yourself as a supportive companion
- Lets them know you're here to listen and help
- Invites them to share what's on their mind or how they're feeling
- Makes them feel safe and comfortable"""

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

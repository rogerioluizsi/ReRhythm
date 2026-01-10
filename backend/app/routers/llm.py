from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.database import get_db
from app.models import User, CheckIn, WearableData
from app.schemas import CheckInRequest, CheckInResponse
from app.utils.interventions import load_interventions
from app.utils.llm_utils import structured_response

router = APIRouter(prefix="/check-in", tags=["AI Check-in"])


@router.post("/analyze", response_model=CheckInResponse)
def analyze_check_in(request: CheckInRequest, db: Session = Depends(get_db)):
    """
    Analyze user check-in data with optional wearable data integration.
    Returns sanitized check-in with recommended interventions.
    """
    
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's latest wearable data if it exists
    wearable_info = None
    latest_wearable = db.query(WearableData)\
        .filter(WearableData.user_id == request.user_id)\
        .order_by(WearableData.created_at.desc())\
        .first()
    
    if latest_wearable is not None:
        wearable_info = latest_wearable.wearable_data
    
    # Load interventions library
    interventions = load_interventions()
    
    # Prepare interventions metadata for LLM (only essential fields)
    interventions_metadata = [
        {
            "id": str(intervention["id"]),
            "name": intervention["name"],
            "category": intervention["category"],
            "trigger_case": intervention["trigger_case"]
        }
        for intervention in interventions
    ]
    
    # Build the system prompt
    system_prompt = """You are an AI assistant helping with mental health interventions for medical professionals.

Your task is to:
1. MANDATORY: Remove all sensitive data (names, dates, specific locations, identifying information) from the user's check-in.
2. Analyze the check-in data and wearable data (if provided) to understand the user's mental state.
3. Select the 1-3 most relevant intervention IDs from the provided intervention library based on the user's needs.
4. Provide clear reasoning for your recommendations.

You must respond with a JSON object containing:
- sanitized_text: The check-in text with all sensitive data removed (MANDATORY)
- recommended_intervention_ids: Array of intervention IDs (as strings)
- ai_reasoning: Brief (1-3) rows explanation of why these interventions were selected (never add ids here)

Be concise, empathetic, and focus on practical recommendations.

### Never shared Ids on the ai_reasoning field! Only share them on the recommended_intervention_ids field.
"""
    
    # Build user message with context
    user_message = f"""Check-in data: {request.check_in_data}

"""
    
    if wearable_info is not None:
        user_message += f"""Wearable data: {wearable_info}

"""
    
    user_message += f"""Available interventions:
{json.dumps(interventions_metadata, indent=2)}

Please analyze this information and provide your response."""
    
    # Define the response schema for structured output
    response_schema = {
        "type": "object",
        "properties": {
            "sanitized_text": {
                "type": "string",
                "description": "The check-in text with all sensitive data removed"
            },
            "recommended_intervention_ids": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Array of recommended intervention IDs"
            },
            "ai_reasoning": {
                "type": "string",
                "description": "Brief explanation for the recommendations"
            }
        },
        "required": ["sanitized_text", "recommended_intervention_ids", "ai_reasoning"],
        "additionalProperties": False
    }
    
    try:
        # Call OpenAI API with structured output using shared utility
        result = structured_response(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            schema=response_schema,
            schema_name="check_in_analysis"
        )
        
        # Convert intervention IDs array to comma-separated string for database
        intervention_ids_str = ",".join(result["recommended_intervention_ids"])
        
        # Create and save the check-in record
        new_check_in = CheckIn(
            user_id=request.user_id,
            check_in_data=request.check_in_data,
            sanitized_text=result["sanitized_text"],
            recommended_intervention_ids=intervention_ids_str,
            ai_reasoning=result["ai_reasoning"],
            created_at=datetime.utcnow()
        )
        
        db.add(new_check_in)
        db.commit()
        db.refresh(new_check_in)
        
        # Return response
        return CheckInResponse(
            sanitized_text=result["sanitized_text"],
            recommended_intervention_ids=intervention_ids_str,
            ai_reasoning=result["ai_reasoning"]
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing check-in with AI: {str(e)}"
        )

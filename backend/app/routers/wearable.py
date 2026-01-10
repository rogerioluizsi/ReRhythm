from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json
from typing import List

from app.database import get_db
from app.models import User, WearableData
from app.schemas import WearableDataRequest, WearableDataResponse, WearableDataSummary, WearableCheckResponse
from app.utils.llm_utils import structured_response

router = APIRouter(prefix="/user/wearable", tags=["Wearable Data"])


@router.post("", response_model=WearableDataResponse)
def save_wearable_data(request: WearableDataRequest, db: Session = Depends(get_db)):
    """
    Saves or updates the user's latest wearable data to their profile.
    Works for both anonymous and authenticated users.
    """
    
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new wearable data entry
    new_wearable = WearableData(
        user_id=request.user_id,
        wearable_data=request.wearable_data
    )
    
    db.add(new_wearable)
    db.commit()
    db.refresh(new_wearable)
    
    return WearableDataResponse(success=True)


@router.get("/view", response_model=List[WearableDataSummary])
def view_wearable_data(user_id: int, limit: int = 1, db: Session = Depends(get_db)):
    """
    Extract user wearable information from user's records.
    Uses LLM to summarize information based on user_id.
    """
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all wearable data for the user
    wearable_records = db.query(WearableData)\
        .filter(WearableData.user_id == user_id)\
        .order_by(WearableData.created_at.desc())\
        .limit(limit)\
        .all()
    
    if not wearable_records:
        return []
    
    # Summarize each wearable data record using LLM
    summaries = []
    
    for record in wearable_records:
        try:
            # Parse wearable data (assuming it's JSON)
            wearable_json = json.loads(record.wearable_data) if isinstance(record.wearable_data, str) else record.wearable_data
            
            # Create prompt for LLM to summarize
            prompt = f"""
Summarize the user's health insights from this wearable data in 2-3 sentences. This summary will be displayed alongside plots of the data, so avoid repeating raw numbers and focus on analysis, key patterns, and any notable concerns or trends.

{json.dumps(wearable_json, indent=2)}

Highlight aspects like activity levels, heart rate trends, sleep quality, and overall well-being.
"""
            
            # Define the response schema for structured output
            response_schema = {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "A concise summary of the wearable data"
                    }
                },
                "required": ["summary"],
                "additionalProperties": False
            }
            
            try:
                # Call OpenAI API with structured output using shared utility
                result = structured_response(
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that summarizes health and wearable data in a clear, concise manner."},
                        {"role": "user", "content": prompt}
                    ],
                    schema=response_schema,
                    schema_name="wearable_summary"
                )
                
                summary = result["summary"]
                
            except Exception as e:
                summary = f"Error generating summary: {str(e)}"
            
            summaries.append(WearableDataSummary(
                date=record.created_at,  # type: ignore
                wearable_data_summary=summary
            ))
            
        except json.JSONDecodeError:
            # If wearable_data is not valid JSON, use it as-is with a simpler summary
            summaries.append(WearableDataSummary(
                date=record.created_at,  # type: ignore
                wearable_data_summary=f"Wearable data recorded: {record.wearable_data[:100]}..."
            ))
        except Exception as e:
            # Log error but continue processing other records
            print(f"Error processing wearable record {record.id}: {str(e)}")
            summaries.append(WearableDataSummary(
                date=record.created_at,  # type: ignore
                wearable_data_summary="Error processing this wearable data record"
            ))
    
    return summaries


@router.get("/check", response_model=WearableCheckResponse)
def check_wearable_data(user_id: int, db: Session = Depends(get_db)):
    """
    Check if a user has any wearable data and return the latest created_at if available.
    """
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the latest wearable data for the user
    latest_wearable = db.query(WearableData)\
        .filter(WearableData.user_id == user_id)\
        .order_by(WearableData.created_at.desc())\
        .first()
    
    if latest_wearable:
        data = None
        try:
            data = json.loads(latest_wearable.wearable_data) if isinstance(latest_wearable.wearable_data, str) else latest_wearable.wearable_data
        except json.JSONDecodeError:
            data = None

        return WearableCheckResponse(success=True, created_at=latest_wearable.created_at, data=data)
    else:
        return WearableCheckResponse(success=False, created_at=None, data=None)

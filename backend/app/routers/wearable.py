from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json
from typing import List

from app.database import get_db
from app.models import User, WearableData
from app.schemas import WearableDataRequest, WearableDataResponse, WearableDataSummary, WearableCheckResponse
from app.utils.llm_utils import chat_completion

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
def view_wearable_data(user_id: int, db: Session = Depends(get_db)):
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
Summarize the following wearable data in a concise, user-friendly format (2-3 sentences max):

{json.dumps(wearable_json, indent=2)}

Focus on key metrics like steps, heart rate, sleep, and any notable patterns or concerns.
"""
            
            # Call OpenAI API using shared utility
            summary = chat_completion(
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes health and wearable data in a clear, concise manner."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            if not summary:
                summary = "No summary available"
            
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
        return WearableCheckResponse(success=True, created_at=latest_wearable.created_at)
    else:
        return WearableCheckResponse(success=False, created_at=None)

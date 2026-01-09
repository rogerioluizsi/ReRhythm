from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import json
import os

from app.database import get_db
from app.models import UserIntervention

router = APIRouter(prefix="/library", tags=["Interventions Library"])

# Load interventions library
INTERVENTIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "interventions_library.json")

# Pydantic schemas
class CompleteInterventionRequest(BaseModel):
    user_id: int
    intervention_id: str

class CompleteInterventionResponse(BaseModel):
    success: bool

class InterventionResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    times_completed: Optional[int] = None
    last_completed: Optional[datetime] = None

def load_interventions():
    """Load interventions from JSON file"""
    with open(INTERVENTIONS_FILE, "r") as f:
        return json.load(f)


@router.get("/interventions")
def get_interventions(
    intervention_ids: Optional[List[int]] = Query(None, description="List of intervention IDs to retrieve"),
    user_id: Optional[int] = Query(None, description="User ID to filter interventions they have completed"),
    db: Session = Depends(get_db)
):
    """
    Get intervention metadata from the library.
    
    - If no parameters: Returns all interventions
    - If intervention_ids provided: Returns specific interventions by ID
    - If user_id provided: Returns all interventions, annotating those the user has completed
    - If both provided: Returns specific interventions by ID, annotating completion data for user
    """
    all_interventions = load_interventions()
    
    # Filter by specific intervention_ids if provided
    if intervention_ids is not None:
        all_interventions = [i for i in all_interventions if i["id"] in intervention_ids]
    
    # If user_id provided, get completion data and filter
    if user_id is not None:
        user_interventions = db.query(UserIntervention).filter(
            UserIntervention.user_id == user_id
        ).all()
        
        # Create a dict of intervention_id -> completion data
        completion_data = {
            ui.intervention_id: {
                "times_completed": ui.times_completed,
                "last_completed": ui.last_completed_at
            }
            for ui in user_interventions
        }
        
        # Note: We do NOT filter by completed_ids here, so the user sees all available interventions.
        # Logic removed:
        # if intervention_ids is None:
        #     completed_ids = [int(iid) for iid in completion_data.keys()]
        #     all_interventions = [i for i in all_interventions if i["id"] in completed_ids]
        
        # Add completion data to interventions
        for intervention in all_interventions:
            iid = str(intervention["id"])
            if iid in completion_data:
                intervention["times_completed"] = completion_data[iid]["times_completed"]
                intervention["last_completed"] = completion_data[iid]["last_completed"]
            else:
                intervention["times_completed"] = None
                intervention["last_completed"] = None
    
    return {
        "count": len(all_interventions),
        "interventions": all_interventions
    }


@router.post("/interventions/complete", response_model=CompleteInterventionResponse)
def complete_intervention(
    request: CompleteInterventionRequest,
    db: Session = Depends(get_db)
):
    """
    Record an intervention completion for a user.
    
    - Creates a new record if user hasn't completed this intervention before
    - Increments times_completed and updates last_completed_at for existing records
    """
    # Check if user has already completed this intervention
    user_intervention = db.query(UserIntervention).filter(
        UserIntervention.user_id == request.user_id,
        UserIntervention.intervention_id == request.intervention_id
    ).first()
    
    current_time = datetime.utcnow()
    
    if user_intervention:
        # Update existing record
        user_intervention.times_completed += 1
        user_intervention.last_completed_at = current_time
    else:
        # Create new record
        user_intervention = UserIntervention(
            user_id=request.user_id,
            intervention_id=request.intervention_id,
            times_completed=1,
            last_completed_at=current_time
        )
        db.add(user_intervention)
    
    db.commit()
    
    return CompleteInterventionResponse(success=True)

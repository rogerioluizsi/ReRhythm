from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import JournalEntry, User
from app.schemas import JournalCreateRequest, JournalEntry as JournalEntrySchema, SuccessResponse

router = APIRouter(prefix="/journal", tags=["journal"])


@router.post("/create", response_model=SuccessResponse)
def create_journal_entry(
    request: JournalCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new journal entry for a user.
    
    Expiration types:
    - "7_days": Entry expires 7 days from creation
    - "30_days": Entry expires 30 days from creation
    - "delete_manually": Entry never expires automatically
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate expiration type
    valid_expiration_types = ["7_days", "30_days", "delete_manually"]
    if request.expiration_type not in valid_expiration_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid expiration_type. Must be one of: {', '.join(valid_expiration_types)}"
        )
    
    # Calculate expiration date based on expiration_type
    expires_at = None
    if request.expiration_type == "7_days":
        expires_at = datetime.utcnow() + timedelta(days=7)
    elif request.expiration_type == "30_days":
        expires_at = datetime.utcnow() + timedelta(days=30)
    # For "delete_manually", expires_at remains None
    
    # Create journal entry
    journal_entry = JournalEntry(
        user_id=request.user_id,
        journal_description=request.journal_description,
        expiration_type=request.expiration_type,
        expires_at=expires_at
    )
    
    db.add(journal_entry)
    db.commit()
    db.refresh(journal_entry)
    
    return SuccessResponse(success=True, message="Journal entry created successfully")


@router.get("/history", response_model=List[JournalEntrySchema])
def get_journal_history(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all journal entries for a user.
    
    Automatically filters out expired entries and deletes them.
    Returns entries sorted by creation date (newest first).
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all journal entries for the user
    journal_entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == user_id
    ).order_by(JournalEntry.created_at.desc()).all()
    
    # Filter out expired entries and delete them
    active_entries = []
    current_time = datetime.utcnow()
    
    for entry in journal_entries:
        # Check if entry has expired
        if entry.expires_at and entry.expires_at <= current_time:
            # Delete expired entry
            db.delete(entry)
        else:
            active_entries.append(entry)
    
    # Commit deletions if any
    db.commit()
    
    # Format response
    response = []
    for entry in active_entries:
        response.append(JournalEntrySchema(
            id=entry.id,
            date=entry.created_at,
            journal=entry.journal_description,
            expires_at=entry.expires_at
        ))
    
    return response


@router.delete("/entry/{entry_id}", response_model=SuccessResponse)
def delete_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a specific journal entry by ID.
    
    Returns success message if the entry is deleted or doesn't exist.
    """
    # Find the journal entry
    journal_entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    
    if not journal_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Delete the entry
    db.delete(journal_entry)
    db.commit()
    
    return SuccessResponse(success=True, message="Journal entry deleted successfully")

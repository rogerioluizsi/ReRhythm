from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, AccountWipeRequest, AccountWipeResponse
from app.utils.auth import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Creates a session. If no credentials are provided, it creates an anonymous "guest" user.
    If provided, it performs a traditional login.
    """
    # Case 1: Anonymous login (no email or password)
    if not request.email and not request.password:
        # Check if device_id already exists
        existing_user = db.query(User).filter(User.device_id == request.device_id).first()
        
        if existing_user:
            # Return existing anonymous user
            token = create_access_token(data={"sub": str(existing_user.id), "device_id": request.device_id})
            return LoginResponse(
                token=token,
                user_id=existing_user.id,
                is_anonymous=existing_user.is_anonymous
            )
        
        # Create new anonymous user
        new_user = User(
            device_id=request.device_id,
            is_anonymous=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = create_access_token(data={"sub": str(new_user.id), "device_id": request.device_id})
        return LoginResponse(
            token=token,
            user_id=new_user.id,
            is_anonymous=True
        )
    
    # Case 2: Traditional login with email and password
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Both email and password are required for login")
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token(data={"sub": str(user.id), "device_id": request.device_id})
    
    return LoginResponse(
        token=token,
        user_id=user.id,
        is_anonymous=user.is_anonymous
    )


@router.delete("/account/wipe", response_model=AccountWipeResponse)
def wipe_account(request: AccountWipeRequest, db: Session = Depends(get_db)):
    """
    The "Panic Button." Permanently deletes the account and all associated records 
    from the database immediately.
    """
    # Find the user
    user = db.query(User).filter(User.id == request.user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the user (cascading will delete all related records)
    db.delete(user)
    db.commit()
    
    return AccountWipeResponse(
        success=True,
        message="All data deleted"
    )

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AccountWipeRequest, AccountWipeResponse
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
        # Always create a new anonymous user with ephemeral device_id
        # Each anonymous session is unique to prevent data leakage
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


@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Creates a new user account with email and password.
    """
    # Validate that passwords match
    if request.password != request.repeat_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Validate password strength (minimum 6 characters)
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        device_id=request.device_id,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        is_anonymous=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    token = create_access_token(data={"sub": str(new_user.id), "device_id": request.device_id})
    
    return RegisterResponse(
        token=token,
        user_id=new_user.id,
        is_anonymous=False
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

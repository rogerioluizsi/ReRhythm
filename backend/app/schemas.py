from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Authentication schemas
class LoginRequest(BaseModel):
    device_id: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    user_id: int
    is_anonymous: bool

    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    repeat_password: str
    device_id: str


class RegisterResponse(BaseModel):
    token: str
    user_id: int
    is_anonymous: bool

    class Config:
        from_attributes = True


class AccountWipeRequest(BaseModel):
    user_id: int


class AccountWipeResponse(BaseModel):
    success: bool
    message: str

    class Config:
        from_attributes = True


# Check-in schemas
class CheckInRequest(BaseModel):
    user_id: int
    check_in_data: str
    wearable_data: Optional[str] = None


class CheckInResponse(BaseModel):
    sanitized_text: str
    recommended_intervention_ids: str
    ai_reasoning: str

    class Config:
        from_attributes = True


# Wearable data schemas
class WearableDataRequest(BaseModel):
    user_id: int
    wearable_data: str


class WearableDataResponse(BaseModel):
    success: bool

    class Config:
        from_attributes = True


class WearableDataSummary(BaseModel):
    date: datetime
    wearable_data_summary: str

    class Config:
        from_attributes = True


class WearableCheckResponse(BaseModel):
    success: bool
    created_at: Optional[datetime] = None
    data: Optional[dict] = None

    class Config:
        from_attributes = True


# Intervention schemas
class InterventionBase(BaseModel):
    id: str
    title: str
    short_description: Optional[str] = None
    duration_seconds: Optional[int] = None
    category: Optional[str] = None


class InterventionDetail(BaseModel):
    id: str
    title: str
    full_instructions: str

    class Config:
        from_attributes = True


class InterventionCompletionRequest(BaseModel):
    user_id: int
    intervention_id: str
    times: int


# Journal schemas
class JournalCreateRequest(BaseModel):
    user_id: int
    journal_description: str
    expiration_type: str  # "7_days", "30_days", "delete_manually"


class JournalEntry(BaseModel):
    id: int
    date: datetime
    journal: str
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# General response schemas
class SuccessResponse(BaseModel):
    success: bool
    message: Optional[str] = None


class WipeAccountRequest(BaseModel):
    user_id: int


# Journaling Counseling schemas
class StartCounselingRequest(BaseModel):
    user_id: int


class StartCounselingResponse(BaseModel):
    conversation_id: int
    counseling: str

    class Config:
        from_attributes = True


class FollowUpRequest(BaseModel):
    conversation_id: int
    message: str


class FollowUpResponse(BaseModel):
    counseling: str

    class Config:
        from_attributes = True

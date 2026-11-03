import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$")

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Full name of traveler")
    email: str = Field(..., max_length=255, description="Unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (at least 8 characters)")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email address format. Example: traveler@example.com")
        return cleaned

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return cleaned


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    user: UserResponse
    total_bookings: int
    total_searches: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LogoutResponse(BaseModel):
    message: str
    status: str = "LOGGED_OUT"

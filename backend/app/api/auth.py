from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.recommendation import RecommendationHistory
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    UserProfileResponse,
    TokenResponse,
    LogoutResponse,
)
from app.services.security import hash_password, verify_password
from app.services.jwt_service import create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account with secure bcrypt password hashing."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    pw_hash = hash_password(payload.password)
    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=pw_hash,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a signed JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Returns the basic profile of the authenticated user."""
    return current_user

@router.get("/profile", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the full profile of the authenticated user including booking and search counts."""
    booking_count = db.query(Booking).filter(Booking.user_id == current_user.id).count()
    search_count = db.query(RecommendationHistory).filter(RecommendationHistory.user_id == current_user.id).count()

    return UserProfileResponse(
        user=UserResponse.model_validate(current_user),
        total_bookings=booking_count,
        total_searches=search_count,
    )

@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """
    Clears authenticated session.
    With stateless JWTs, the client discards the token; endpoint acknowledges logout.
    """
    return LogoutResponse(
        message=f"User {current_user.email} successfully logged out.",
        status="LOGGED_OUT",
    )

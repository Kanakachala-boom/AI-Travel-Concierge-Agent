import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
from app.config import settings

def create_access_token(user_id_or_data: Union[int, str, Dict[str, Any]], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token for a given user ID or dictionary."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    if isinstance(user_id_or_data, dict):
        uid = str(user_id_or_data.get("sub") or user_id_or_data.get("id"))
    else:
        uid = str(user_id_or_data)

    payload: Dict[str, Any] = {
        "sub": uid,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[int]:
    """
    Decodes and validates a JWT token.
    Returns the integer user ID if valid and not expired, otherwise returns None.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat"]}
        )
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        return None

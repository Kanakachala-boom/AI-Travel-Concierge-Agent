# Backend Documentation: FastAPI Application & Architecture

## Overview
The backend is built with FastAPI, utilizing asynchronous handlers, dependency injection, and Pydantic validation.

## Module Breakdown

### 1. Application Entry Point (`app/main.py`)
- Initializes the `FastAPI` instance with title, version, and OpenAPI tags.
- Configures `CORSMiddleware` supporting configured frontend origins.
- Registers API routers under prefix `/api`.
- Sets up centralized exception handling ensuring consistent JSON error responses.

### 2. Configuration (`app/config.py`)
Powered by Pydantic's `BaseSettings`:
- `APP_ENV`: Deployment mode (`development`, `production`).
- `DATABASE_URL`: Connection string (`sqlite:///./concierge.db` or PostgreSQL).
- `JWT_SECRET_KEY`: Cryptographic signing secret.
- `JWT_ALGORITHM`: Signature standard (`HS256`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration window (default: 1440 min / 24 hours).
- `PROVIDER_MODE`: `simulated` or `amadeus`.

### 3. Database Layer (`app/database.py`)
- Configures SQLAlchemy `engine` and `sessionmaker`.
- Provides the `get_db()` dependency for safe per-request session lifecycles.
- Contains `init_db()` which executes automatic backward-compatible SQLite table migrations (such as adding `user_id` foreign keys).

### 4. Security & JWT Services (`app/services/`)
- `security.py`:
  - `hash_password(password: str) -> str`: Hashes passwords using `bcrypt.hashpw` with 12-round salt.
  - `verify_password(plain_password: str, hashed_password: str) -> bool`: Timing-safe password verification.
- `jwt_service.py`:
  - `create_access_token(data: Union[int, str, dict], expires_delta: Optional[timedelta] = None) -> str`: Generates signed HS256 tokens.
  - `decode_access_token(token: str) -> Optional[dict]`: Validates signature and expiration, returning payload claims.

### 5. Dependency Injection (`app/api/deps.py`)
- `get_current_user`: Extracts token from `Authorization: Bearer <token>` header, decodes user identity, and queries the `users` table. Rejects unauthenticated requests with HTTP 401.

### 6. Provider Layer (`app/services/`)
- `provider_interface.py`: Defines the `TravelProviderInterface` contract.
- `simulated_provider.py`: Deterministic inventory provider with Indian route coverage, offer verification logic, and duplicate booking prevention.
- `amadeus_provider.py`: Production-ready adapter for the live Amadeus for Developers Travel API.

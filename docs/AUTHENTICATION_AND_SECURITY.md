# Authentication and Security Architecture

## Overview
The application implements an industry-standard, stateless **JSON Web Token (JWT)** authentication framework that strictly adheres to RFC 7519 and cryptographic best practices.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Browser
    participant API as FastAPI Router
    participant Security as bcrypt / PyJWT
    participant DB as SQLite DB

    Note over Client,DB: User Registration
    Client->>API: POST /api/auth/register (name, email, password)
    API->>API: Validate regex & password complexity
    API->>Security: hash_password(password)
    Security->>Security: bcrypt.gensalt(12) + hashpw()
    Security-->>API: $2b$12$...
    API->>DB: INSERT INTO users
    API-->>Client: 201 Created (UserResponse without password)

    Note over Client,DB: User Login
    Client->>API: POST /api/auth/login (email, password)
    API->>DB: SELECT * FROM users WHERE email = :email
    API->>Security: verify_password(password, user.password_hash)
    Security-->>API: Password Valid (True)
    API->>Security: create_access_token(sub=user.id, email=user.email)
    Security-->>API: Encoded HS256 Token
    API-->>Client: 200 OK (access_token, user_object)

    Note over Client,DB: Authenticated API Requests
    Client->>API: POST /api/recommendations (Header: Authorization: Bearer <token>)
    API->>Security: decode_access_token(token)
    Security-->>API: Claims (sub=user.id)
    API->>DB: SELECT * FROM users WHERE id = sub
    API->>API: get_current_user succeeds
    API-->>Client: 200 OK (AI Recommendations)
```

## Security Features

### 1. Password Hashing with Salt Rounds
- **Algorithm**: `bcrypt` (Blowfish-based cipher).
- **Cost Factor**: 12 salt rounds (`gensalt(rounds=12)`).
- **Security Properties**:
  - Automatically incorporates a cryptographically random per-user salt.
  - Mitigates precomputed rainbow table attacks.
  - Computationally intensive to resist high-speed GPU/ASIC brute-force cracking.

### 2. Cryptographic JWT Signing
- **Algorithm**: `HS256` (HMAC with SHA-256).
- **Secret Key**: Loaded from `JWT_SECRET_KEY` in environment.
- **Key Generation Recommendation**:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **Claim Integrity**:
  - `sub`: User ID (`int`)
  - `email`: User email (`str`)
  - `iat`: Timestamp of token issuance
  - `exp`: Timestamp of token expiration (24-hour default)

### 3. Timing-Attack Safe Verification
- During login, verification evaluates credentials in constant time to prevent user enumeration via timing differentials.

### 4. Client-Side Route Guards & Token Hygiene
- Tokens are stored in `localStorage` under `concierge_jwt_token`.
- The hash router blocks navigation to protected views if no token exists.
- The HTTP client traps any `401 Unauthorized` response, immediately purges stored credentials, dispatches an auth change event, and redirects to `#login`.

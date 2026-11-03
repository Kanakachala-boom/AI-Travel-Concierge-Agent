# API Documentation: Endpoints & Contracts

## Base URL
- Local: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 1. Authentication Endpoints

### Register User
- **Endpoint**: `POST /api/auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "full_name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "full_name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "is_active": true,
    "created_at": "2026-11-03T18:00:00Z"
  }
  ```

### Login User
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "full_name": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "is_active": true,
      "created_at": "2026-11-03T18:00:00Z"
    }
  }
  ```

### Get Authenticated User
- **Endpoint**: `GET /api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**: `UserResponse`

### Get User Profile & Concierge Stats
- **Endpoint**: `GET /api/auth/profile`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**:
  ```json
  {
    "user": { ... },
    "total_bookings": 2,
    "total_searches": 5
  }
  ```

### Logout User
- **Endpoint**: `POST /api/auth/logout`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**:
  ```json
  {
    "message": "Successfully logged out."
  }
  ```

---

## 2. Recommendation & Travel Planning Endpoints

### Run Cognitive Recommendation Agent
- **Endpoint**: `POST /api/recommendations`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "departure_city": "Delhi",
    "destination_city": "Mumbai",
    "departure_date": "2026-11-10",
    "return_date": "2026-11-14",
    "adults": 2,
    "budget": 60000.0,
    "preferred_hotel_stars": 3,
    "hotel_category_is_hard": true,
    "preferred_airline": "IndiGo",
    "max_flight_stops": 0,
    "max_flight_stops_is_hard": false,
    "room_sharing": 2
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "search-uuid-v4",
    "status": "OPTIMAL",
    "message": "Found optimal package within budget.",
    "currency": "INR",
    "best_package": { ... },
    "alternative_packages": [ ... ],
    "explanation": "...",
    "itemized_cost_breakdown": { ... },
    "actionable_suggestions": []
  }
  ```

### Recommendation Search History
- **Endpoint**: `GET /api/recommendations/history`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**: Array of past `RecommendationHistoryItem` records belonging exclusively to current user.

---

## 3. Verification & Booking Endpoints

### Revalidate Offer Price & Inventory
- **Endpoint**: `POST /api/verify-offer`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "offer_id": "PKG-6E-101-6E-102-1",
    "package_details": { ... }
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "offer_id": "PKG-6E-101-6E-102-1",
    "status": "VERIFIED",
    "current_price": 54200.0,
    "price_difference": 0.0,
    "verified_at": "2026-11-03T18:05:00Z",
    "message": "Offer verified successfully."
  }
  ```

### Confirm Simulated Booking
- **Endpoint**: `POST /api/booking/confirm`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "offer_id": "PKG-6E-101-6E-102-1",
    "confirm": true,
    "customer": {
      "name": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "phone": "+91 9876543210",
      "passenger_count": 2
    },
    "package_details": { ... }
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "CONFIRMED_SIMULATED",
    "booking_reference": "SIM-RES-A1B2C3D4",
    "customer_name": "Priya Sharma",
    "total_charged": 54200.0,
    "currency": "INR",
    "message": "Simulated booking confirmed."
  }
  ```

### Booking History
- **Endpoint**: `GET /api/booking/history`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**: Array of user's personal booking records.

### Booking Lookup
- **Endpoint**: `GET /api/booking/{booking_reference}`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**: Single booking details if owned by current user; otherwise `404 Not Found`.

# System Architecture: Automated E-Commerce Concierge Agent

## Architectural Philosophy
The system follows a decoupled, multi-tier client-server architecture designed for high availability, deterministic execution, and clear separation of concerns.

```mermaid
graph TD
    subgraph Presentation ["Presentation Layer (Port 5500)"]
        SPA["Vanilla JavaScript SPA"]
        Router["Client Hash Router (router.js)"]
        Guard["Authentication Route Guard"]
        State["State Manager (state.js)"]
        APIClient["API Integration Client (api.js)"]
    end

    subgraph Transport ["REST Transport Layer"]
        HTTP["HTTP / JSON API Protocol"]
        Bearer["Authorization: Bearer <JWT>"]
    end

    subgraph ServiceLayer ["FastAPI Application (Port 8000)"]
        CORS["CORS Middleware"]
        AuthDeps["Security Dependency (get_current_user)"]
        AuthRouter["Auth Router (/api/auth)"]
        RecRouter["Recommendations Router (/api/recommendations)"]
        BookRouter["Booking Router (/api/booking)"]
        InvRouter["Inventory Routers (/api/flights, /api/hotels)"]
    end

    subgraph CoreAI ["Core Agent & Domain Engine"]
        Agent["7-Stage Cognitive Concierge Agent"]
        CSP["Constraint Satisfaction Engine"]
        Ranker["Multi-Criteria Ranker"]
        Provider["Provider Interface (Simulated / Amadeus)"]
    end

    subgraph Persistence ["Persistence Layer"]
        SQLite["SQLite Database (concierge.db)"]
        Users["users"]
        Bookings["bookings"]
        History["recommendation_history"]
    end

    SPA --> Router
    Router --> Guard
    Guard --> State
    SPA --> APIClient
    APIClient --> HTTP
    APIClient --> Bearer

    HTTP --> CORS
    CORS --> AuthRouter
    CORS --> RecRouter
    CORS --> BookRouter
    CORS --> InvRouter

    RecRouter --> AuthDeps
    BookRouter --> AuthDeps
    InvRouter --> AuthDeps

    RecRouter --> Agent
    Agent --> CSP
    Agent --> Ranker
    Agent --> Provider

    BookRouter --> Provider
    Provider --> Persistence
    AuthRouter --> Persistence
```

## Architectural Tiers

### 1. Presentation Tier (Vanilla Frontend)
- **Host**: Python `http.server` running on `http://127.0.0.1:5500`.
- **Implementation**: Pure HTML5, CSS3 with modern CSS custom properties, and modular ES6 JavaScript.
- **Routing**: Client-side hash routing (`window.location.hash`) intercepting `#login`, `#register`, `#home`, `#results`, `#details`, `#verify`, `#booking`, `#my-bookings`, `#history`, and `#profile`.
- **Client State**: Centralized `AppStateManager` persisting JWT access tokens and session data in browser `localStorage`.
- **Network Interceptor**: `api.js` automatically attaches `Authorization: Bearer <token>` to requests and traps `401 Unauthorized` responses to safely force user re-authentication.

### 2. Application & API Tier (FastAPI Backend)
- **Host**: Uvicorn ASGI server running on `http://127.0.0.1:8000`.
- **Validation**: Strict payload validation using Pydantic schemas.
- **Dependency Injection**: Reusable dependencies (`get_db`, `get_current_user`) for connection lifecycle management and route security.
- **Error Handling**: Centralized exception handler ensuring all API errors return standardized JSON envelopes (`{"status": "ERROR", "message": "...", "path": "..."}`).

### 3. Intelligence & Optimization Tier (Agent Core)
- **ConciergeAgent**: Encapsulates the 7-stage sense–plan–act cycle.
- **Decoupled Providers**: Abstract `TravelProviderInterface` allowing transparent swapping between offline `SimulatedTravelProvider` and live GDS adapters (`AmadeusProviderAdapter`).

### 4. Data & Persistence Tier (SQLAlchemy & SQLite)
- **Engine**: SQLAlchemy 2.0 with connection pooling.
- **Tables**: `users`, `bookings`, `recommendation_history`, `flights`, and `hotels`.
- **Migration**: Automatic schema inspection on startup ensuring backward-compatible addition of columns and foreign keys.

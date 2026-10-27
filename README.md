# Automated E-Commerce Concierge Agent

A full-stack travel recommendation web application powered by a Python goal-based intelligent agent. The concierge evaluates feasible flight and hotel travel packages across simulated Indian corridors, strictly enforces hard constraints, minimizes total package cost in INR (₹), applies deterministic multi-criteria tie-breakers, and transparently explains its decisions.

---

## 🌟 Key Features

- **Goal-Based Intelligent Agent**: 7-stage cognitive pipeline (Perception, Goal Formulation, Candidate Generation, Constraint Satisfaction, Cost Calculation, Optimization, and Explanation).
- **Hard Constraints Enforcement**: Validates route continuity, temporal departure/return ordering, hotel location, day-by-day room availability, seat capacity, budget limits, and mandatory hotel star ratings.
- **Deterministic Multi-Criteria Tie-Breaking**:
  1. Primary: Lowest total package cost
  2. Tie-breaker 1: Fewer total flight stops
  3. Tie-breaker 2: Shorter total travel duration
  4. Tie-breaker 3: More convenient departure/arrival times
  5. Tie-breaker 4: Higher hotel star rating
  6. Tie-breaker 5: Deterministic identifier fallback
- **Transparent Cost Calculation**: Accurate formulas for flight fares, nightly hotel rates, party room sharing, and remaining budget savings.
- **Diagnostic Infeasible Reporting**: When a query cannot be satisfied, the agent details why combinations were rejected (e.g., budget exceeded, star mismatch, lack of seats) and provides actionable suggestions.
- **Full-Stack Architecture**:
  - **Frontend**: React 19 + Vite + TypeScript with Vanilla CSS design system (dark glassmorphism, responsive cards, micro-animations, quick test scenario triggers).
  - **Backend API**: Python FastAPI with Pydantic V2 schemas and centralized error handling.
  - **Database & ORM**: PostgreSQL / SQLite via SQLAlchemy ORM with Alembic migrations and automated seed data scripts.

---

## 🏗️ Project Architecture & Directory Structure

```text
e:\Projects\AI project\
├── backend\
│   ├── app\
│   │   ├── main.py                     # FastAPI entrypoint, lifespan, CORS, and error handlers
│   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   ├── database.py                 # SQLAlchemy engine, session maker, and Base
│   │   ├── models\                     # SQLAlchemy ORM models
│   │   │   ├── flight.py               # Flight inventory model
│   │   │   ├── hotel.py                # Hotel & daily availability models
│   │   │   └── recommendation.py       # Recommendation history persistence
│   │   ├── schemas\                    # Pydantic request & response validation
│   │   │   ├── flight.py
│   │   │   ├── hotel.py
│   │   │   └── recommendation.py
│   │   ├── agent\                      # Independent Goal-Based Intelligent Agent
│   │   │   ├── agent.py                # ConciergeAgent orchestrator (Stages 1-7)
│   │   │   ├── constraints.py          # Hard & soft constraint satisfiers
│   │   │   ├── optimizer.py            # Cost minimizer & deterministic tie-breakers
│   │   │   ├── explainer.py            # Rationale & diagnostic suggestions
│   │   │   └── types.py                # Agent DTOs and data models
│   │   ├── api\                        # REST route handlers
│   │   │   ├── health.py               # GET /api/health
│   │   │   ├── flights.py              # GET /api/flights
│   │   │   ├── hotels.py               # GET /api/hotels
│   │   │   └── recommendations.py      # POST /api/recommendations, GET /api/recommendations/{id}
│   │   └── seeds\                      # Seed datasets & runner
│   │       ├── seed_data.py            # 32+ flights & 18+ hotels across Indian corridors
│   │       └── run_seed.py             # CLI database populator
│   ├── tests\                          # Automated test suite (21 pytest cases)
│   │   ├── conftest.py
│   │   ├── test_agent.py               # Agent logic & tie-breaking tests
│   │   ├── test_api.py                 # API endpoints & scenario integration tests
│   │   └── test_scenarios.py           # Infeasible edge cases & DB failure tests
│   ├── alembic\                        # Alembic migrations
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend\                           # React + Vite + TypeScript application
│   ├── src\
│   │   ├── App.tsx                     # Main layout & state orchestrator
│   │   ├── index.css                   # Custom CSS design system
│   │   ├── types\index.ts              # TypeScript interfaces matching backend
│   │   ├── services\api.ts             # Fetch client for REST endpoints
│   │   └── components\
│   │       ├── Header.tsx              # Brand & backend status indicator
│   │       ├── SearchForm.tsx          # Validated input form with chips & toggles
│   │       ├── QuickScenarios.tsx      # 1-click test scenarios (Tight-budget, Luxury, Infeasible)
│   │       ├── RecommendationCard.tsx  # Best package card with breakdown & explanation
│   │       ├── AlternativeCard.tsx     # Ranked alternatives accordion
│   │       ├── FlightCard.tsx          # Visual flight cards with timeline
│   │       ├── HotelCard.tsx           # Hotel cards with rating and amenities
│   │       ├── CostBreakdown.tsx       # Flight + hotel math breakdown table
│   │       └── ErrorState.tsx          # Diagnostic empty & infeasible state
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml                  # PostgreSQL container definition
└── README.md
```

---

## 🚀 Setup and Running Locally

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v22)
- **Database**: PostgreSQL (or SQLite default for instant zero-dependency execution)

---

### Step 1: Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Environment Variables:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *Note*: The application defaults to `sqlite:///./concierge.db` for instant local execution. If using PostgreSQL, set:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/concierge_db
   ```
   (You can launch PostgreSQL with `docker-compose up -d` in the workspace root).

5. Initialize Database & Seed Simulated Inventory:
   ```bash
   python app/seeds/run_seed.py
   ```
   Or apply migrations:
   ```bash
   alembic upgrade head
   ```

6. Start FastAPI Server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API will be available at:
   - Base URL: `http://127.0.0.1:8000`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
   - ReDoc Docs: `http://127.0.0.1:8000/redoc`

---

### Step 2: Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   The frontend will be available at: `http://127.0.0.1:5173/`

---

## 🧪 Running Automated Tests

Run the complete test suite (21 automated unit and integration tests):

```bash
cd backend
.\venv\Scripts\pytest
```

### Test Coverage Highlights:
- **`tests/test_agent.py`**:
  - `test_perception_validation_errors`: Validates chronological dates, non-identical cities, and positive budget.
  - `test_room_calculation`: Tests room requirements with and without party room sharing.
  - `test_tight_budget_optimization`: Scenario 1 tight-budget cost minimization.
  - `test_luxury_trip_satisfaction`: Scenario 2 luxury 5-star hotel fulfillment.
  - `test_infeasible_budget_and_explanation`: Scenario 3 impossible budget handling.
  - `test_deterministic_tie_breaking`: Verifies deterministic tie-breaking on identical costs.
- **`tests/test_api.py`**:
  - `test_health_endpoint`: Verifies `/api/health` and database connection.
  - `test_flights_endpoint` & `test_hotels_endpoint`: Verifies inventory filtering.
  - Scenario 1, 2, and 3 full REST integration tests.
  - Persistence testing: `GET /api/recommendations/{id}` and `GET /api/recommendations/history`.
- **`tests/test_scenarios.py`**:
  - `test_empty_search_results_unknown_city`: Graceful handling of unseeded cities.
  - `test_insufficient_seats_edge_case`: Large passenger group exceeding seat capacity.
  - `test_database_connection_failure_handling`: Graceful HTTP 500 error handling when database drops.
  - `test_hotel_strict_category_mismatch`: Strict star constraint with small budget.

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check verifying service and database status |
| `GET` | `/api/flights` | Query simulated flights (filters: `origin`, `destination`, `date`, `airline`, `max_stops`) |
| `GET` | `/api/hotels` | Query simulated hotels (filters: `city`, `star_rating`, `max_price`, `amenity`) |
| `POST` | `/api/recommendations` | Execute goal-based agent optimization and return ranked packages |
| `GET` | `/api/recommendations/{id}` | Retrieve a previously saved recommendation by UUID |
| `GET` | `/api/recommendations/history` | List recent recommendation search histories |

---

## 💡 Example Scenarios Evaluated

1. **Tight-Budget Trip (₹20,000)**:
   - **Input**: Delhi → Mumbai, 2026-11-10 to 2026-11-14, 1 Adult, Budget ₹20,000, 3★ Hotel.
   - **Agent Output**: Selects Treebo Trend Vits Select (₹2,800/night) paired with SpiceJet flights (₹3,600 + ₹3,550).
   - **Total Package Cost**: ₹18,350 (₹1,650 remaining under budget).

2. **Luxury Trip (₹1,50,000)**:
   - **Input**: Delhi → Mumbai, 2026-11-10 to 2026-11-14, 2 Adults, Budget ₹1,50,000, Strict 5★ Hotel.
   - **Agent Output**: Selects The Oberoi Nariman Point (₹21,500/night) paired with flights.
   - **Total Package Cost**: ₹1,00,300 (₹49,700 remaining under budget).

3. **Infeasible Trip (₹4,000)**:
   - **Input**: Delhi → Goa, 2 Adults, Budget ₹4,000, 4★ Hotel.
   - **Agent Output**: Identifies that minimum flight fare alone exceeds ₹4,000. Rejects all 27 combinations, summarizes rejections, and provides actionable suggestions to increase budget or consider alternative dates.

---

## 🔒 Scope & Extensions

- **Zero External API Dependencies**: All flight schedules, seat counts, hotel rooms, and prices are simulated internally.
- **LLM Decoupled**: The core goal-based agent uses deterministic constraint satisfaction and mathematical optimization without requiring third-party LLM API keys.
- **Future Ready**: The modular agent architecture in `backend/app/agent/` can be extended with conversational LLM natural language interfaces, live GDS API connectors, or multi-objective Pareto frontiers.

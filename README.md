# AI Travel Concierge Agent

### Automated E-Commerce Concierge Agent — AI Travel Planning Assistant

An intelligent goal-based AI travel planning assistant that recommends optimized flight and hotel packages using constraint satisfaction, cost optimization, and simulated booking workflows.

---

## 📌 Problem Statement

Planning multi-city travel involves comparing hundreds of flight and hotel combinations across varying budgets, dates, and preferences. Travelers face information overload, inconsistent pricing, and difficulty identifying the optimal package that satisfies all their constraints. This project addresses that challenge with a deterministic, transparent AI agent.

---

## 🎯 Project Objectives

1. Build a **goal-based intelligent agent** that autonomously selects the best travel package from all feasible combinations.
2. Implement **hard constraint satisfaction** to eliminate infeasible packages before optimization.
3. Provide **transparent cost breakdowns** and explainable rationale for every recommendation.
4. Support a **safe booking workflow** with offer revalidation and explicit user confirmation.
5. Create a **full-stack application** (FastAPI backend + React frontend) suitable for academic demonstration.

---

## 🌟 Key Features

- **Goal-Based Intelligent Agent**: 7-stage cognitive pipeline — Perception, Goal Formulation, Candidate Generation, Constraint Satisfaction, Cost Calculation, Optimization, and Explanation.
- **Hard Constraints Enforcement**: Validates route continuity, temporal ordering, hotel location, day-by-day room availability, seat capacity, budget limits, and mandatory hotel star ratings.
- **Deterministic Multi-Criteria Tie-Breaking**:
  1. Primary: Lowest total package cost
  2. Tie-breaker 1: Fewer total flight stops
  3. Tie-breaker 2: Shorter total travel duration
  4. Tie-breaker 3: More convenient departure/arrival times
  5. Tie-breaker 4: Higher hotel star rating
  6. Tie-breaker 5: Deterministic identifier fallback
- **Transparent Cost Calculation**: Accurate formulas for flight fares, nightly hotel rates, party room sharing, and remaining budget savings.
- **Diagnostic Infeasible Reporting**: When a query cannot be satisfied, the agent details why combinations were rejected and provides actionable suggestions.
- **Offer Revalidation & Safe Booking**: Explicit two-phase booking with price re-verification and confirmation enforcement.
- **Full-Stack Architecture**:
  - **Backend**: Python FastAPI with Pydantic V2 schemas, SQLAlchemy ORM, and automated test suite.
  - **Frontend**: React 19 + Vite + TypeScript with dark glassmorphism design system.
  - **Database**: PostgreSQL / SQLite via SQLAlchemy with Alembic migrations and seed scripts.

---

## 🧠 AI Architecture & Working Methodology

### Goal-Based Agent (Sense–Plan–Act)

```
┌────────────────────────────────────────────────────┐
│               PERCEPTION & VALIDATION              │
│  Parse travel query → Validate constraints         │
├────────────────────────────────────────────────────┤
│               GOAL FORMULATION                     │
│  Objective: min(Total Package Cost)                │
│  Subject to: All Hard Constraints = True           │
├────────────────────────────────────────────────────┤
│        STATE-SPACE PRUNING & CANDIDATE GEN         │
│  Filter flights by route/date → Filter hotels      │
│  Generate all (outbound × return × hotel) combos   │
├────────────────────────────────────────────────────┤
│            CONSTRAINT SATISFACTION                  │
│  Route continuity, temporal order, seat capacity,  │
│  room occupancy, star rating, budget limits        │
├────────────────────────────────────────────────────┤
│              COST CALCULATION                       │
│  Per-passenger flight fare + per-room hotel rate   │
│  Party room sharing + total package cost           │
├────────────────────────────────────────────────────┤
│         MULTI-CRITERIA OPTIMIZATION                │
│  Rank by cost → stops → duration → times → stars  │
├────────────────────────────────────────────────────┤
│          EXPLAINABILITY & TRANSPARENCY              │
│  Generate rationale, cost breakdown, suggestions   │
└────────────────────────────────────────────────────┘
```

### Constraint Satisfaction & Optimization

The agent uses a **generate-and-test** approach with **forward pruning**:
- **Hard constraints** are checked exhaustively — any violation eliminates the candidate.
- **Soft optimization** ranks surviving candidates by total cost with deterministic tie-breakers.
- **Infeasibility diagnostics** categorize rejections (budget exceeded, star mismatch, no seats, date conflict) and suggest remediation.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Python 3.10+, FastAPI, Pydantic V2 |
| **Database & ORM** | SQLAlchemy 2.0, Alembic, PostgreSQL / SQLite |
| **Frontend** | React 19, Vite, TypeScript, Vanilla CSS |
| **Testing** | pytest, httpx (TestClient) |
| **Containerization** | Docker Compose (PostgreSQL) |
| **Provider Adapters** | Simulated Provider (default), Amadeus API adapter (optional) |

---

## 📁 Project Folder Structure

```text
AI-Travel-Concierge-Agent/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint, lifespan, CORS, error handlers
│   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   ├── database.py                 # SQLAlchemy engine, session maker, and Base
│   │   ├── agent/                      # Goal-Based Intelligent Agent
│   │   │   ├── agent.py                # ConciergeAgent orchestrator (Stages 1-7)
│   │   │   ├── constraints.py          # Hard & soft constraint satisfiers
│   │   │   ├── optimizer.py            # Cost minimizer & deterministic tie-breakers
│   │   │   ├── explainer.py            # Rationale & diagnostic suggestions
│   │   │   └── types.py                # Agent DTOs and data models
│   │   ├── api/                        # REST route handlers
│   │   │   ├── health.py               # GET /api/health
│   │   │   ├── flights.py              # GET /api/flights
│   │   │   ├── hotels.py               # GET /api/hotels
│   │   │   ├── recommendations.py      # POST /api/recommendations
│   │   │   └── booking.py              # POST /api/verify-offer, /api/booking/confirm
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │   ├── flight.py
│   │   │   ├── hotel.py
│   │   │   ├── booking.py
│   │   │   └── recommendation.py
│   │   ├── schemas/                    # Pydantic request & response validation
│   │   │   ├── flight.py
│   │   │   ├── hotel.py
│   │   │   ├── booking.py
│   │   │   └── recommendation.py
│   │   ├── services/                   # Travel provider abstractions
│   │   │   ├── provider_interface.py   # Abstract provider interface
│   │   │   ├── simulated_provider.py   # Deterministic simulated inventory
│   │   │   └── amadeus_provider.py     # Optional Amadeus API adapter
│   │   └── seeds/                      # Database seed datasets & runner
│   │       ├── seed_data.py            # 32+ flights & 27+ hotels across Indian corridors
│   │       ├── inventory_service.py    # Dynamic inventory generator
│   │       └── run_seed.py             # CLI database populator
│   ├── tests/                          # Automated test suite (39 pytest cases)
│   │   ├── conftest.py
│   │   ├── test_agent.py
│   │   ├── test_api.py
│   │   ├── test_scenarios.py
│   │   ├── test_provider_and_booking.py
│   │   └── test_amadeus_adapter.py
│   ├── alembic/                        # Alembic database migrations
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── .env.example
│   └── README.md                       # Detailed backend documentation
│
├── frontend/                           # React + Vite + TypeScript application
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.css                   # Custom CSS design system
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml                  # PostgreSQL container definition
├── .gitignore
└── README.md                           # This file
```

---

## 🚀 Backend Setup & Running Locally

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v22) — for frontend only
- **Database**: PostgreSQL (optional) or SQLite (default, zero-dependency)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kanakachala-boom/AI-Travel-Concierge-Agent.git
cd AI-Travel-Concierge-Agent
```

### Step 2: Backend Setup

```powershell
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
Copy-Item .env.example .env

# Initialize database and seed simulated inventory
python -m app.seeds.run_seed

# Start the FastAPI server
python -m uvicorn app.main:app --reload
```

> **macOS / Linux alternative:**
> ```bash
> python3 -m venv venv
> source venv/bin/activate
> pip install -r requirements.txt
> cp .env.example .env
> python -m app.seeds.run_seed
> python -m uvicorn app.main:app --reload
> ```

### Step 3: Verify Backend

- **Base URL**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Docs**: `http://127.0.0.1:8000/redoc`

### Step 4: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: `http://127.0.0.1:5173/`

---

## 🧪 Running Automated Tests

Run the full test suite (39 tests):

```powershell
cd backend
python -m pytest -v
```

### Test Coverage Breakdown

| Test File | Tests | Coverage |
|---|---|---|
| `test_agent.py` | 6 | Perception validation, room calculation, budget optimization, luxury trips, infeasible explanations, tie-breaking |
| `test_api.py` | 11 | Health endpoint, flights/hotels filtering, scenario integration, 422 validation, history retrieval |
| `test_scenarios.py` | 4 | Unseeded routes, insufficient seats, DB disconnect, strict hotel star mismatch |
| `test_provider_and_booking.py` | 9 | Provider abstraction, offer revalidation, booking confirmation, provider rejection |
| `test_amadeus_adapter.py` | 9 | Unconfigured fallback, OAuth2, rate-limit, timeout, flight parsing, sandbox disclaimers |

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check verifying service and database status |
| `GET` | `/api/flights` | Query simulated flights (filters: origin, destination, date, airline, max_stops) |
| `GET` | `/api/hotels` | Query simulated hotels (filters: city, star_rating, max_price, amenity) |
| `POST` | `/api/recommendations` | Execute goal-based agent optimization and return ranked packages |
| `GET` | `/api/recommendations/{id}` | Retrieve a previously saved recommendation by UUID |
| `GET` | `/api/recommendations/history` | List recent recommendation search histories |
| `POST` | `/api/verify-offer` | Revalidate offer price & availability prior to booking |
| `POST` | `/api/booking/confirm` | Submit reservation (requires explicit `confirm: true`) |

---

## ⚙️ Environment Variable Configuration

Copy `.env.example` to `.env` in the `backend/` directory. Key settings:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./concierge.db` | Database connection string |
| `PROVIDER_MODE` | `simulated` | `simulated` (default) or `amadeus` |
| `APP_ENV` | `development` | Application environment |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `AMADEUS_CLIENT_ID` | *(empty)* | Optional Amadeus API key |
| `AMADEUS_CLIENT_SECRET` | *(empty)* | Optional Amadeus API secret |

---

## ⚠️ Simulated Provider Disclaimer

> **This application uses simulated travel inventory by default.** All flight schedules, seat counts, hotel rooms, and prices are generated internally for academic demonstration purposes. Booking references (`SIM-RES-...`) carry explicit academic disclaimers. **No actual airline tickets, hotel reservations, or monetary payments are processed.**

The optional Amadeus adapter connects to the Amadeus Self-Service **Test** sandbox and similarly does not produce real-world reservations.

---

## 💡 Example Scenarios

1. **Tight-Budget Trip (₹20,000)**: Delhi → Mumbai, 4 nights, 1 adult, 3★ hotel → Agent selects cheapest valid package.
2. **Luxury Trip (₹1,50,000)**: Delhi → Mumbai, 4 nights, 2 adults, strict 5★ → Agent satisfies luxury constraint within budget.
3. **Infeasible Trip (₹4,000)**: Delhi → Goa, 2 adults, 4★ → Agent reports infeasibility with diagnostic rejections and actionable suggestions.

---

## 👥 Team Collaboration Guide

### Cloning the Repository

```bash
git clone https://github.com/Kanakachala-boom/AI-Travel-Concierge-Agent.git
cd AI-Travel-Concierge-Agent
```

### Creating a Feature Branch

Before making any changes, create your own branch:

```bash
git checkout -b feature/your-task
```

### Committing and Pushing Your Work

```bash
git add .
git commit -m "Describe your changes clearly"
git push -u origin feature/your-task
```

Then create a **Pull Request** on GitHub for review.

### Adding Collaborators

The repository owner can add teammates via:
**GitHub → Repository → Settings → Collaborators → Add people**

Enter each teammate's GitHub username or email and grant appropriate access.

### Branch Naming Conventions

| Branch Pattern | Purpose |
|---|---|
| `main` | Stable production branch |
| `feature/your-task` | New feature development |
| `bugfix/issue-description` | Bug fixes |
| `docs/what-you-documented` | Documentation updates |

---

## 🔒 Security Notes

- **Never commit** `.env` files, API keys, or database credentials.
- The `.gitignore` is configured to exclude sensitive files.
- Use `.env.example` as a template — teammates should create their own `.env` locally.

---

## 📄 License

This project is developed for academic purposes as part of the **Automated E-Commerce Concierge Agent** course project.

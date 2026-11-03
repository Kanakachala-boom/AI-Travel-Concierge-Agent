# Testing and Verification Guide

## Testing Overview
The project maintains a dual-layer verification strategy:
1. **Automated Backend Pytest Suite**: 73 unit and integration tests executing in Python.
2. **Real Headless Chrome DevTools Protocol (CDP) Suite**: 10 end-to-end browser automation steps executing real HTTP calls and DOM interactions.

---

## 1. Automated Pytest Suite

### Running Pytest
```powershell
cd "E:\Projects\AI project"
python -m pytest -v
```

### Test Modules Breakdown (73 Passed)
| Test Module | Test Count | Target Scope |
| :--- | :---: | :--- |
| `backend/tests/test_agent.py` | 10 | Perception validation, room calculation, tight budget optimization, luxury trip satisfaction, infeasible budget diagnostics, deterministic tie-breaking, explanation accuracy under hard/soft constraints |
| `backend/tests/test_amadeus_adapter.py` | 9 | Adapter fallback, OAuth2 token authentication, 401 error handling, 429 rate limit handling, timeout handling, flight parsing, offer revalidation, explicit confirmation checks |
| `backend/tests/test_api.py` | 13 | Health endpoint, flights inventory, hotels inventory, recommendation scenarios (tight budget, luxury, infeasible), date ordering validation, origin/dest equality validation, non-existent ID lookups, history list endpoint, UTF-8 rupee symbol encoding |
| `backend/tests/test_auth.py` | 13 | User registration (success, duplicate email, invalid email, weak password, short name), user login (success, wrong password, nonexistent email), token security (`/api/auth/me`, invalid token, unauthenticated 401), multi-tenant data isolation (cross-user booking and history protection, anonymous rejection) |
| `backend/tests/test_frontend_integration.py` | 3 | Static asset existence, zero-framework dependency verification, end-to-end search-to-booking contract |
| `backend/tests/test_provider_and_booking.py` | 22 | Provider factory defaults, explicit simulation labels, itemized breakdowns in responses, offer verification states (success, repriced, expired, unknown offer, missing fields, currency mismatch, mismatched IDs), booking confirmation, provider rejection, duplicate booking safety, history and lookup endpoints |
| `backend/tests/test_scenarios.py` | 3 | Empty search results for unknown cities, insufficient seat capacity handling, hotel strict category mismatch handling |

---

## 2. Real Google Chrome DevTools Protocol (CDP) Test Suite

### Running the Chrome CDP Test
Ensure both backend (`:8000`) and frontend (`:5500`) are running, then execute:
```powershell
cd "E:\Projects\AI project"
node test_e2e_chrome.js
```

### 10-Step Verification Lifecycle
1. **Headless Chrome Launch**: Spawns clean instance on port 9222 with fresh temporary profile.
2. **Target & CDP Connection**: Connects via WebSockets to Chrome DevTools Protocol.
3. **Route Guard Test**: Requests `#home` unauthenticated $\to$ verifies automatic redirect to `#login` with `#view-login` visible.
4. **User Registration & Auto-Login**: Registers User A (Priya Sharma), verifies login, verifies redirect to `#home`, verifies user name in navbar.
5. **Travel Search**: Fills travel criteria (Delhi $\to$ Mumbai, 2 adults, ₹60,000 budget), clicks search, verifies `#results` view and best package card.
6. **Package Details & Verification**: Clicks *"View Details"*, navigates to `#details`, advances to `#verify`, triggers re-check, verifies `VERIFIED` status badge.
7. **Simulated Booking Submission**: Navigates to `#booking`, verifies traveler name/email are pre-filled, checks explicit confirmation toggle, submits form, verifies reference code (`SIM-RES-XXXXXXXX`).
8. **User A Bookings & Profile**: Navigates to `#my-bookings`, verifies reference code is listed; navigates to `#profile`, verifies `total_bookings >= 1`.
9. **User Logout & Multi-Tenant Data Isolation**: Logs User A out, verifies redirect to `#login`. Registers User B (Rajesh Kumar), navigates to `#my-bookings`, and **verifies that User B CANNOT see User A's booking reference**.
10. **Console Error Check**: Inspects CDP console log buffer, verifying **0 JavaScript console errors** across the entire session.

# Automated E-Commerce Concierge Agent — Frontend

Plain HTML5 + CSS3 + vanilla ES6 modules. No frameworks, no build step.

## Run
```bash
cd frontend
python -m http.server 5500
# open http://localhost:5500
```
(ES modules need an HTTP server; opening the file directly won't work.)

## Connect to FastAPI backend
Default base URL: `http://localhost:8000`, endpoint `POST /api/recommendations`.
Override with `?api=http://host:port` in the URL, or `localStorage.setItem("concierge_api_url", "...")`.

Enable CORS in FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

Request body sent (adjust `toPayload()` in `js/app.js` to match your Pydantic schema):
```json
{ "departure_city": "Bengaluru", "destination_city": "Mumbai", "departure_date": "2026-12-10",
  "return_date": "2026-12-15", "adults": 2, "hotel_category": 4, "budget": 50000,
  "preferred_airline": null, "max_stops": null, "amenities": [] }
```

Response: `js/results.js` accepts `best_package` + `alternatives`, or a `packages`/`recommendations`
list (first = best). Flight objects: `airline, flight_number, departure_time, arrival_time, duration,
stops, price_per_adult, total_cost`. Hotel: `name, category, location, amenities, price_per_night,
nights, rooms, total_cost`. Package: `total_cost, flight_cost, hotel_cost, remaining_budget,
explanation, rank`. Common naming variants are handled in `normalisePackage()`.

## Architecture
- `js/api.js` — fetch, timeout, HTTP/network error handling (`ApiError`).
- `js/validation.js` — field rules + inline error display.
- `js/results.js` — rendering of loading/error/empty states, best package, alternatives.
- `js/app.js` — form submit, loading state, reset, nav, scrolling, search history.
- `css/style.css` — CSS variables, Grid/Flexbox, breakpoints at 960px and 640px.

No mock data is used: all results come from the backend.

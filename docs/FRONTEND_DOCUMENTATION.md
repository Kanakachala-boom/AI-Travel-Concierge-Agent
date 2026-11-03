# Frontend Documentation: Vanilla Single-Page Application

## Philosophy: Zero Framework, Pure Web Standards
The frontend avoids heavy JavaScript frameworks (React, Angular, Vue), build tools (Webpack, Vite), and transpilers. It runs natively in modern web browsers using:
- **HTML5**: Semantic and accessible markup.
- **CSS3**: Modern layouts using CSS Grid, Flexbox, and CSS Custom Properties for unified theme variables.
- **Vanilla ES6 JavaScript**: Native modules (`import` / `export`), async/await, and event-driven state updates.

## Component Structure

```
frontend/
├── index.html          # Semantic single-page layout holding all page-view sections
├── css/
│   └── style.css       # Complete stylesheet with theme colors and responsive rules
└── js/
    ├── api.js          # HTTP client, endpoint definitions, JWT bearer injection, 401 interceptor
    ├── app.js          # Main UI controller, event binders, and page view orchestrators
    ├── results.js      # Pure rendering functions for cards, breakdowns, verification & booking
    ├── router.js       # Client hash router with authentication route guards
    ├── state.js        # Centralized reactive state and localStorage manager
    └── validation.js   # Client-side input validation and error display utilities
```

## Routing & Route Guards (`frontend/js/router.js`)
Routing is hash-driven (`#login`, `#register`, `#home`, etc.):
```javascript
const PUBLIC_ROUTES = ["#login", "#register"];

export function handleRoute() {
  const hash = window.location.hash || "#login";
  const authenticated = state.isAuthenticated();

  if (!authenticated && !PUBLIC_ROUTES.includes(hash)) {
    window.location.hash = "#login";
    return;
  }
  if (authenticated && PUBLIC_ROUTES.includes(hash)) {
    window.location.hash = "#home";
    return;
  }
  // Transition views
  document.querySelectorAll(".page-view").forEach(v => v.hidden = true);
  const targetView = document.getElementById(ROUTE_VIEW_MAP[hash]);
  if (targetView) targetView.hidden = false;
}
```

## API Client Architecture (`frontend/js/api.js`)
All communication with the backend routes through the `request()` helper:
1. Dynamically detects backend host (default: `http://127.0.0.1:8000`).
2. Injects `Authorization: Bearer <token>` when a token is stored.
3. Automatically sets `Content-Type: application/json`.
4. Traps HTTP 401 errors:
   ```javascript
   if (response.status === 401 && !endpoint.includes("/api/auth/login")) {
     state.clearAuth();
     window.location.hash = "#login";
   }
   ```

## State Management (`frontend/js/state.js`)
The `AppStateManager` singleton synchronizes state between in-memory properties and browser storage:
- `TOKEN_KEY` (`concierge_jwt_token`): Stored in `localStorage`.
- `USER_KEY` (`concierge_user`): Stored in `localStorage`.
- Dispatches custom DOM event `concierge_auth_changed` on login/logout so the navigation bar updates instantly.

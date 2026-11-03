// Multi-page client-side router supporting authentication guards, browser back/forward, and direct reloads
import { state } from "./state.js";

const ROUTES = {
  "#login": "view-login",
  "#register": "view-register",
  "#profile": "view-profile",
  "#home": "view-home",
  "#results": "view-results",
  "#details": "view-details",
  "#verify": "view-verify",
  "#booking": "view-booking",
  "#my-bookings": "view-my-bookings",
  "#history": "view-history",
};

export class Router {
  constructor(onRouteChanged) {
    this.onRouteChanged = onRouteChanged;
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleRoute());
    window.addEventListener("concierge_auth_changed", () => {
      this.updateNavState();
      this.handleRoute();
    });
    
    // Global delegated click listener for data-navigate
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-navigate]");
      if (el) {
        e.preventDefault();
        this.navigate(el.dataset.navigate);
      }
    });
  }

  navigate(hash) {
    if (window.location.hash === hash) {
      this.handleRoute();
    } else {
      window.location.hash = hash;
    }
  }

  getCurrentRoute() {
    const hash = window.location.hash;
    const isAuthed = state.isAuthenticated();

    // Guard: Unauthenticated users are redirected to #login
    if (!isAuthed) {
      if (hash === "#register") return "#register";
      return "#login";
    }

    // Guard: Authenticated users visiting #login or #register are redirected to #home
    if (hash === "#login" || hash === "#register" || !hash) {
      return "#home";
    }

    return ROUTES[hash] ? hash : "#home";
  }

  updateNavState() {
    const isAuthed = state.isAuthenticated();
    const user = state.getUser();

    // Elements
    const authLinks = document.querySelectorAll(".nav-auth-only");
    const anonLinks = document.querySelectorAll(".nav-anon-only");
    const userBadge = document.getElementById("navUserBadge");
    const userNameEl = document.getElementById("navUserName");

    authLinks.forEach((el) => {
      el.style.display = isAuthed ? "" : "none";
    });
    anonLinks.forEach((el) => {
      el.style.display = isAuthed ? "none" : "";
    });

    if (userBadge && userNameEl) {
      if (isAuthed && user) {
        userBadge.style.display = "inline-flex";
        userNameEl.textContent = user.full_name || user.email;
      } else {
        userBadge.style.display = "none";
      }
    }
  }

  handleRoute() {
    const targetRoute = this.getCurrentRoute();

    // If current hash doesn't match guarded target route, update URL hash
    if (window.location.hash !== targetRoute) {
      window.location.hash = targetRoute;
      return; // hashchange listener will re-invoke handleRoute
    }

    const activeViewId = ROUTES[targetRoute] || "view-login";

    // Hide all view sections
    document.querySelectorAll(".page-view").forEach((view) => {
      view.hidden = view.id !== activeViewId;
    });

    // Update navbar active states & visibility
    this.updateNavState();

    const navMapping = {
      "#login": "nav-login",
      "#register": "nav-register",
      "#profile": "nav-profile",
      "#home": "nav-home",
      "#results": "nav-results",
      "#details": "nav-results",
      "#verify": "nav-results",
      "#booking": "nav-results",
      "#my-bookings": "nav-my-bookings",
      "#history": "nav-history",
    };

    const activeNavId = navMapping[targetRoute];
    document.querySelectorAll("#navLinks a").forEach((a) => {
      a.classList.toggle("active", a.id === activeNavId);
    });

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: "instant" });

    // Trigger page-specific view rendering
    if (this.onRouteChanged) {
      this.onRouteChanged(targetRoute);
    }
  }
}

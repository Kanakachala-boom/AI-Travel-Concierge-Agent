// Application workflow and authentication state management with localStorage & sessionStorage persistence
const STATE_STORAGE_KEY = "concierge_app_state";
const TOKEN_KEY = "concierge_jwt_token";
const USER_KEY = "concierge_user";

class AppStateManager {
  constructor() {
    this.searchPayload = null;
    this.responseData = null;
    this.selectedPackage = null;
    this.verificationState = null;
    
    // Authentication state
    this.token = localStorage.getItem(TOKEN_KEY) || null;
    this.user = this._loadUser();
    
    this.loadState();
  }

  _loadUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // --- Auth Methods ---
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn("Failed to persist auth to localStorage:", e);
    }
    window.dispatchEvent(new CustomEvent("concierge_auth_changed", { detail: { isAuthenticated: Boolean(token), user } }));
  }

  setUser(user) {
    this.user = user;
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn("Failed to persist user update:", e);
    }
    window.dispatchEvent(new CustomEvent("concierge_auth_changed", { detail: { isAuthenticated: Boolean(this.token), user } }));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn("Failed to clear auth from localStorage:", e);
    }
    this.clearWorkflow();
    window.dispatchEvent(new CustomEvent("concierge_auth_changed", { detail: { isAuthenticated: false, user: null } }));
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  // --- Workflow Methods ---
  saveState() {
    try {
      const data = {
        searchPayload: this.searchPayload,
        responseData: this.responseData,
        selectedPackage: this.selectedPackage,
        verificationState: this.verificationState,
      };
      sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save session state:", e);
    }
  }

  loadState() {
    try {
      const raw = sessionStorage.getItem(STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.searchPayload = parsed.searchPayload || null;
        this.responseData = parsed.responseData || null;
        this.selectedPackage = parsed.selectedPackage || null;
        this.verificationState = parsed.verificationState || null;
      }
    } catch (e) {
      console.warn("Failed to rehydrate session state:", e);
    }
  }

  setSearch(payload, response) {
    this.searchPayload = payload;
    this.responseData = response;
    this.selectedPackage = response?.best_package ? response.best_package : null;
    this.verificationState = null; // Clear any old verification
    this.saveState();
  }

  setSelectedPackage(pkg) {
    this.selectedPackage = pkg;
    this.verificationState = null; // Invalidate verification whenever package changes
    this.saveState();
  }

  setVerification(v) {
    this.verificationState = v;
    if (v && v.current_price != null && this.selectedPackage) {
      this.selectedPackage.total_cost = v.current_price;
    }
    this.saveState();
  }

  clearWorkflow() {
    this.selectedPackage = null;
    this.verificationState = null;
    this.saveState();
  }
}

export const state = new AppStateManager();

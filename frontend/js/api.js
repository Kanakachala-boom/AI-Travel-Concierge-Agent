// Backend communication with the FastAPI travel recommendation & concierge service.
import { state } from "./state.js";

export const API_BASE_URL = (function () {
  const fromQuery = new URLSearchParams(window.location.search).get("api");
  if (fromQuery) return fromQuery.replace(/\/+$/, "");
  const fromStorage = localStorage.getItem("concierge_api_url");
  if (fromStorage) return fromStorage.replace(/\/+$/, "");

  // Dynamically match current hostname (handles both localhost and 127.0.0.1)
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "127.0.0.1";

  if (window.location.protocol === "file:") return "http://127.0.0.1:8000";
  if (window.location.port && window.location.port !== "8000") {
    return `${protocol}//${hostname}:8000`;
  }
  if (!window.location.port) {
    return `${protocol}//${hostname}:8000`;
  }
  return "";
})();

const ENDPOINTS = {
  health: "/api/health",
  recommendations: "/api/recommendations",
  searchPackages: "/api/search-packages",
  verifyOffer: "/api/verify-offer",
  confirmBooking: "/api/booking/confirm",
  bookingHistory: "/api/booking/history",
  recommendationHistory: "/api/recommendations/history",
  flights: "/api/flights",
  hotels: "/api/hotels",
  authRegister: "/api/auth/register",
  authLogin: "/api/auth/login",
  authMe: "/api/auth/me",
  authProfile: "/api/auth/profile",
  authLogout: "/api/auth/logout",
};

export class ApiError extends Error {
  constructor(message, { status = 0, detail = null, network = false, data = null } = {}) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.network = network;
    this.data = data;
  }
}

function extractDetail(body) {
  if (!body) return null;
  if (typeof body === "string") return body;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`).join("\n");
  }
  if (Array.isArray(body.details)) {
    return body.details.join("\n");
  }
  return body.message || body.error || null;
}

async function request(endpoint, { method = "GET", body = null, timeoutMs = 60000, auth = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { Accept: "application/json" };
  if (body != null) headers["Content-Type"] = "application/json";

  // Attach JWT Bearer token if present
  if (auth && state.getToken()) {
    headers["Authorization"] = `Bearer ${state.getToken()}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError("Network failure connecting to concierge service", {
      network: true,
      detail: err.message,
    });
  } finally {
    clearTimeout(timer);
  }

  let parsed = null;
  const text = await response.text();
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  // 401 Unauthorized interceptor: clear token and redirect to login if session expired
  if (response.status === 401 && !endpoint.includes("/api/auth/login") && !endpoint.includes("/api/auth/register")) {
    state.clearAuth();
    if (window.location.hash !== "#login" && window.location.hash !== "#register") {
      window.location.hash = "#login";
    }
  }

  if (!response.ok) {
    throw new ApiError(
      (parsed && (parsed.message || parsed.detail)) || `Request failed with status ${response.status}`,
      {
        status: response.status,
        detail: extractDetail(parsed),
        data: parsed,
      }
    );
  }
  return parsed;
}

// --- Health Check ---
export async function checkHealth() {
  try {
    return await request(ENDPOINTS.health, { timeoutMs: 5000, auth: false });
  } catch (e) {
    return { status: "offline", database: "disconnected", error: e.message };
  }
}

// --- Authentication Endpoints ---
export async function registerUser(payload) {
  return await request(ENDPOINTS.authRegister, {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export async function loginUser(payload) {
  return await request(ENDPOINTS.authLogin, {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export async function fetchMe() {
  return await request(ENDPOINTS.authMe);
}

export async function fetchUserProfile() {
  return await request(ENDPOINTS.authProfile);
}

export async function logoutUser() {
  try {
    await request(ENDPOINTS.authLogout, { method: "POST" });
  } catch (e) {
    console.warn("Logout request note:", e);
  } finally {
    state.clearAuth();
  }
}

// --- Travel Concierge Endpoints ---

// Main recommendation search
export async function fetchRecommendations(payload, options = {}) {
  return await request(ENDPOINTS.recommendations, {
    method: "POST",
    body: payload,
    ...options,
  });
}

// Search packages alias
export async function searchPackages(payload, options = {}) {
  return await request(ENDPOINTS.searchPackages, {
    method: "POST",
    body: payload,
    ...options,
  });
}

// Replay recommendation by ID
export async function fetchRecommendationById(id) {
  return await request(`${ENDPOINTS.recommendations}/${encodeURIComponent(id)}`);
}

// Recommendation search history
export async function fetchRecommendationHistory(limit = 8) {
  try {
    return await request(`${ENDPOINTS.recommendationHistory}?limit=${limit}`);
  } catch {
    return [];
  }
}

// Offer revalidation before booking
export async function verifyOffer(payload) {
  return await request(ENDPOINTS.verifyOffer, {
    method: "POST",
    body: payload,
  });
}

// Booking confirmation with explicit user consent
export async function confirmBooking(payload) {
  return await request(ENDPOINTS.confirmBooking, {
    method: "POST",
    body: payload,
  });
}

// Booking history
export async function fetchBookingHistory(limit = 10) {
  try {
    return await request(`${ENDPOINTS.bookingHistory}?limit=${limit}`);
  } catch {
    return [];
  }
}

// Booking lookup by reference
export async function fetchBookingByReference(reference) {
  return await request(`/api/booking/${encodeURIComponent(reference)}`);
}

// Flight inventory
export async function fetchFlights(params = {}) {
  const q = new URLSearchParams(params).toString();
  return await request(`${ENDPOINTS.flights}${q ? `?${q}` : ""}`);
}

// Hotel inventory
export async function fetchHotels(params = {}) {
  const q = new URLSearchParams(params).toString();
  return await request(`${ENDPOINTS.hotels}${q ? `?${q}` : ""}`);
}

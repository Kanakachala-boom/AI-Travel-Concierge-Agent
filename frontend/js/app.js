import {
  checkHealth,
  fetchRecommendations,
  verifyOffer,
  confirmBooking,
  fetchBookingHistory,
  fetchBookingByReference,
  fetchRecommendationById,
  registerUser,
  loginUser,
  logoutUser,
  fetchUserProfile,
  fetchMe,
  ApiError,
} from "./api.js";
import { validateSearch, showErrors, todayISO } from "./validation.js";
import {
  renderLoading,
  renderError,
  renderResults,
  renderPackageDetails,
  renderVerificationView,
  renderBookingView,
  renderBookingReceipt,
  formatINR,
  esc,
  normalisePackage,
} from "./results.js";
import { state } from "./state.js";
import { Router } from "./router.js";

const CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Goa",
  "Kolkata",
  "Chennai",
  "Jaipur",
  "Hyderabad",
  "Pune",
  "Kochi",
  "Ahmedabad",
  "Lucknow",
];

const AMENITY_MAP = {
  wifi: "Free WiFi",
  breakfast: "Breakfast Included",
  pool: "Swimming Pool",
  gym: "Fitness Center",
  parking: "Free Parking",
  spa: "Spa & Wellness",
};

// DOM Containers
const searchForm = document.getElementById("searchForm");
const submitBtn = document.getElementById("submitBtn");
const backendHealthEl = document.getElementById("backendHealth");
const resultsContainer = document.getElementById("resultsContainer");
const packageDetailsContainer = document.getElementById("packageDetailsContainer");
const verificationContainer = document.getElementById("verificationContainer");
const bookingContainer = document.getElementById("bookingContainer");
const bookingHistoryEl = document.getElementById("bookingHistory");
const searchHistoryEl = document.getElementById("searchHistory");
const refreshBookingsBtn = document.getElementById("refreshBookingsBtn");

// Auth DOM Elements
const loginForm = document.getElementById("loginForm");
const loginAlert = document.getElementById("login-alert");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const toggleLoginPwd = document.getElementById("toggleLoginPwd");

const registerForm = document.getElementById("registerForm");
const registerAlert = document.getElementById("register-alert");
const registerSuccess = document.getElementById("register-success");
const regSubmitBtn = document.getElementById("regSubmitBtn");
const toggleRegPwd = document.getElementById("toggleRegPwd");

const navLogoutBtn = document.getElementById("nav-logout");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");
const navUserBadge = document.getElementById("navUserBadge");
const navUserName = document.getElementById("navUserName");
const navAvatarLetter = document.getElementById("navAvatarLetter");

// Profile DOM Elements
const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileCreated = document.getElementById("profileCreated");
const profileBookingsCount = document.getElementById("profileBookingsCount");
const profileSearchesCount = document.getElementById("profileSearchesCount");

let isSubmitting = false;

// Initialize Router
const router = new Router((route) => {
  renderActiveRoute(route);
});

function populateCities() {
  ["departure_city", "destination_city"].forEach((id) => {
    const select = document.getElementById(id);
    if (!select || select.options.length > 1) return;
    CITIES.forEach((c) => select.add(new Option(c, c)));
  });
}

function readForm() {
  const f = searchForm.elements;
  return {
    departure_city: f.departure_city.value,
    destination_city: f.destination_city.value,
    departure_date: f.departure_date.value,
    return_date: f.return_date.value,
    adults: f.adults.value,
    hotel_category: f.hotel_category.value,
    budget: f.budget.value,
    preferred_airline: f.preferred_airline.value,
    max_stops: f.max_stops.value,
    amenities: [...searchForm.querySelectorAll('input[name="amenities"]:checked')].map((i) => i.value),
  };
}

function toPayload(v) {
  const mappedAmenities = (v.amenities || []).map((code) => AMENITY_MAP[code] || code);
  return {
    departure_city: v.departure_city,
    destination_city: v.destination_city,
    departure_date: v.departure_date,
    return_date: v.return_date,
    adults: Number(v.adults),
    budget: Number(v.budget),
    preferred_hotel_stars: v.hotel_category ? Number(v.hotel_category) : null,
    hotel_category_is_hard: true,
    preferred_airline: v.preferred_airline || null,
    max_flight_stops: v.max_stops === "" ? null : Number(v.max_stops),
    max_flight_stops_is_hard: false,
    preferred_amenities: mappedAmenities,
    amenities_are_hard: false,
    room_sharing: true,
  };
}

function setLoading(on) {
  isSubmitting = on;
  submitBtn.disabled = on;
  submitBtn.textContent = on ? "Analyzing & Optimizing..." : "Find Best Package";
}

// Health check updater
async function refreshHealthStatus() {
  if (!backendHealthEl) return;
  try {
    const health = await checkHealth();
    if (health && (health.status === "online" || health.status === "ok")) {
      backendHealthEl.className = "health-badge online";
      backendHealthEl.innerHTML = `<span class="health-dot"></span><span>API: Online</span>`;
      backendHealthEl.title = `FastAPI backend connected (DB: ${health.database || "healthy"})`;
    } else {
      backendHealthEl.className = "health-badge offline";
      backendHealthEl.innerHTML = `<span class="health-dot"></span><span>API: Offline</span>`;
      backendHealthEl.title = "FastAPI backend unreachable";
    }
  } catch {
    backendHealthEl.className = "health-badge offline";
    backendHealthEl.innerHTML = `<span class="health-dot"></span><span>API: Offline</span>`;
  }
}

function updateUserBadge() {
  const user = state.getUser();
  if (user && state.isAuthenticated()) {
    if (navUserBadge) navUserBadge.style.display = "inline-flex";
    if (navUserName) navUserName.textContent = user.full_name || user.email.split("@")[0];
    if (navAvatarLetter) navAvatarLetter.textContent = (user.full_name || user.email)[0].toUpperCase();
  } else {
    if (navUserBadge) navUserBadge.style.display = "none";
  }
}

// Page View Dispatcher
function renderActiveRoute(route) {
  refreshHealthStatus();
  updateUserBadge();

  switch (route) {
    case "#login":
      if (loginAlert) loginAlert.hidden = true;
      break;

    case "#register":
      if (registerAlert) registerAlert.hidden = true;
      if (registerSuccess) registerSuccess.hidden = true;
      break;

    case "#profile":
      renderProfilePageView();
      break;

    case "#home":
      // Home page is static form
      break;

    case "#results":
      renderResultsPageView();
      break;

    case "#details":
      renderDetailsPageView();
      break;

    case "#verify":
      renderVerifyPageView();
      break;

    case "#booking":
      renderBookingPageView();
      break;

    case "#my-bookings":
      loadBookingHistory();
      break;

    case "#history":
      renderSearchHistory();
      break;
  }
}

// ================= AUTH CONTROLLERS =================
async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput = document.getElementById("login_email");
  const passwordInput = document.getElementById("login_password");
  const email = (emailInput?.value || "").trim();
  const password = passwordInput?.value || "";

  if (loginAlert) loginAlert.hidden = true;

  if (!email || !password) {
    if (loginAlert) {
      loginAlert.textContent = "Please enter both email and password.";
      loginAlert.hidden = false;
    }
    return;
  }

  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Signing in...";

  try {
    const res = await loginUser({ email, password });
    state.setAuth(res.access_token, res.user);
    loginForm.reset();
    updateUserBadge();
    router.navigate("#home");
  } catch (err) {
    if (loginAlert) {
      loginAlert.textContent = err.detail || err.message || "Invalid email or password.";
      loginAlert.hidden = false;
    }
  } finally {
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Sign In";
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const nameEl = document.getElementById("reg_name");
  const emailEl = document.getElementById("reg_email");
  const pwdEl = document.getElementById("reg_password");
  const confirmEl = document.getElementById("reg_confirm_password");

  const fullName = (nameEl?.value || "").trim();
  const email = (emailEl?.value || "").trim();
  const password = pwdEl?.value || "";
  const confirmPassword = confirmEl?.value || "";

  if (registerAlert) registerAlert.hidden = true;
  if (registerSuccess) registerSuccess.hidden = true;

  if (!fullName || fullName.length < 2) {
    registerAlert.textContent = "Full name must be at least 2 characters.";
    registerAlert.hidden = false;
    return;
  }

  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (!emailRegex.test(email)) {
    registerAlert.textContent = "Please enter a valid email address.";
    registerAlert.hidden = false;
    return;
  }

  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    registerAlert.textContent = "Password must be at least 8 characters and contain at least 1 letter and 1 number.";
    registerAlert.hidden = false;
    return;
  }

  if (password !== confirmPassword) {
    registerAlert.textContent = "Passwords do not match.";
    registerAlert.hidden = false;
    return;
  }

  regSubmitBtn.disabled = true;
  regSubmitBtn.textContent = "Creating account...";

  try {
    await registerUser({ full_name: fullName, email, password });
    
    // Auto-login after successful registration
    const loginRes = await loginUser({ email, password });
    state.setAuth(loginRes.access_token, loginRes.user);
    registerForm.reset();
    updateUserBadge();
    router.navigate("#home");
  } catch (err) {
    if (registerAlert) {
      registerAlert.textContent = err.detail || err.message || "Registration failed. Email may already be registered.";
      registerAlert.hidden = false;
    }
  } finally {
    regSubmitBtn.disabled = false;
    regSubmitBtn.textContent = "Create Account";
  }
}

async function handleLogout(event) {
  if (event) event.preventDefault();
  try {
    await logoutUser();
  } catch {
    // state is cleared in api.js finally
  }
  updateUserBadge();
  router.navigate("#login");
}

// ================= PROFILE CONTROLLER =================
async function renderProfilePageView() {
  const user = state.getUser();
  if (!user) return;

  if (profileName) profileName.textContent = user.full_name || "Traveler";
  if (profileEmail) profileEmail.textContent = user.email || "";
  if (profileAvatar) profileAvatar.textContent = (user.full_name || user.email || "U")[0].toUpperCase();
  if (profileCreated) {
    profileCreated.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "Active";
  }

  // Fetch full live profile data
  try {
    const fullProfile = await fetchUserProfile();
    if (fullProfile.user) {
      state.setUser(fullProfile.user);
    }
    if (profileBookingsCount) profileBookingsCount.textContent = String(fullProfile.total_bookings ?? 0);
    if (profileSearchesCount) profileSearchesCount.textContent = String(fullProfile.total_searches ?? 0);
  } catch (err) {
    console.warn("Profile fetch note:", err);
  }
}

// ================= PAGE 1: HOME CONTROLLER =================
async function handleSearchSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const values = readForm();
  const errors = validateSearch(values);
  showErrors(searchForm, errors);
  if (Object.keys(errors).length) return;

  const payload = toPayload(values);
  setLoading(true);
  router.navigate("#results");
  renderLoading(resultsContainer);

  try {
    const data = await fetchRecommendations(payload);
    state.setSearch(payload, data);
    saveSearchToLocalHistory(payload, data.id);
    renderResultsPageView();
  } catch (err) {
    const detail = err instanceof ApiError && !err.network ? err.detail || err.message : null;
    renderError(resultsContainer, detail);
  } finally {
    setLoading(false);
  }
}

// ================= PAGE 2: SEARCH RESULTS CONTROLLER =================
function renderResultsPageView() {
  if (!state.responseData) {
    resultsContainer.innerHTML = `
      <div class="state-msg empty-state">
        <p><strong>No active search results.</strong></p>
        <p>Please enter your travel preferences on the Home page.</p>
        <p style="margin-top: 14px;"><a href="#home" class="btn btn-primary btn-sm">Go to Search Form</a></p>
      </div>`;
    return;
  }

  renderResults(resultsContainer, state.responseData, state.searchPayload);

  // Wire selection buttons
  resultsContainer.querySelectorAll('button[data-action="view-details"]').forEach((btn) => {
    btn.onclick = () => {
      const type = btn.dataset.pkgType;
      if (type === "best") {
        state.setSelectedPackage(state.responseData.best_package);
      } else {
        const idx = Number(btn.dataset.pkgIndex);
        const alts = state.responseData.alternative_packages || [];
        if (alts[idx]) {
          state.setSelectedPackage(alts[idx]);
        }
      }
      router.navigate("#details");
    };
  });
}

// ================= PAGE 3: PACKAGE DETAILS CONTROLLER =================
function renderDetailsPageView() {
  const normPkg = normalisePackage(state.selectedPackage, state.searchPayload);
  renderPackageDetails(packageDetailsContainer, normPkg, state.searchPayload);

  const proceedBtn = packageDetailsContainer.querySelector('button[data-action="proceed-to-verify"]');
  if (proceedBtn) {
    proceedBtn.onclick = () => {
      router.navigate("#verify");
    };
  }
}

// ================= PAGE 4: OFFER VERIFICATION CONTROLLER =================
function renderVerifyPageView() {
  const normPkg = normalisePackage(state.selectedPackage, state.searchPayload);
  renderVerificationView(verificationContainer, normPkg, state.verificationState);

  const btnVerify = document.getElementById("btnVerifyOffer") || document.getElementById("btnRunVerification");
  if (btnVerify) {
    btnVerify.onclick = handleOfferVerification;
  }

  const btnContinue = document.getElementById("btnContinueToBooking");
  if (btnContinue) {
    btnContinue.onclick = () => {
      router.navigate("#booking");
    };
  }
}

async function handleOfferVerification() {
  const normPkg = normalisePackage(state.selectedPackage, state.searchPayload);
  if (!normPkg) return;

  const btnVerify = document.getElementById("btnVerifyOffer") || document.getElementById("btnRunVerification");
  const statusBox = document.getElementById("verifyStatusBox");
  const btnContinue = document.getElementById("btnContinueToBooking");

  btnVerify.disabled = true;
  btnVerify.textContent = "Verifying live inventory...";

  const offerId = normPkg.package_id || `PKG-${Date.now()}`;
  const payload = {
    offer_id: String(offerId),
    expected_price: normPkg.total,
    currency: "INR",
    package_details: normPkg.raw || {},
  };

  try {
    const res = await verifyOffer(payload);
    state.setVerification(res);

    if (res.verified) {
      statusBox.innerHTML = `
        <div class="verify-status verified">
          <strong>✓ Offer Revalidated & Confirmed:</strong>
          <p>${esc(res.message || "Provider seat and room inventory confirmed.")}</p>
          <p style="margin-top: 6px;">Verified Fare: <strong>${formatINR(res.current_price ?? normPkg.total)}</strong>.</p>
        </div>`;
      if (btnContinue) btnContinue.disabled = false;
    } else if (res.status === "OFFER_REPRICED") {
      statusBox.innerHTML = `
        <div class="verify-status repriced">
          <strong>⚠️ Fare Repriced by Provider:</strong>
          <p>${esc(res.message)}</p>
          <p style="margin-top: 6px;">New Total Price: <strong>${formatINR(res.current_price)}</strong> (Difference: ${formatINR(res.price_difference)}).</p>
        </div>`;
      if (btnContinue) btnContinue.disabled = false;
    } else {
      statusBox.innerHTML = `
        <div class="verify-status expired">
          <strong>❌ Offer Unavailable:</strong>
          <p>${esc(res.message || "This inventory is no longer available.")}</p>
        </div>`;
      if (btnContinue) btnContinue.disabled = true;
    }
  } catch (err) {
    statusBox.innerHTML = `
      <div class="verify-status expired">
        <strong>❌ Verification Error:</strong>
        <p>${esc(err.message)}</p>
      </div>`;
    if (btnContinue) btnContinue.disabled = true;
  } finally {
    btnVerify.disabled = false;
    btnVerify.textContent = "Re-check Offer Availability";
  }
}

// ================= PAGE 5: BOOKING CONTROLLER =================
function renderBookingPageView() {
  const normPkg = normalisePackage(state.selectedPackage, state.searchPayload);
  renderBookingView(bookingContainer, normPkg, state.verificationState);

  // Pre-fill traveler name and email from authenticated user
  const user = state.getUser();
  if (user) {
    const nameEl = document.getElementById("travelerName");
    const emailEl = document.getElementById("travelerEmail");
    if (nameEl && user.full_name) nameEl.value = user.full_name;
    if (emailEl && user.email) emailEl.value = user.email;
  }

  const bForm = document.getElementById("bookingForm");
  const chkConfirm = document.getElementById("chkExplicitConfirm");
  const btnSubmit = document.getElementById("btnSubmitBooking");
  if (chkConfirm && btnSubmit) {
    chkConfirm.addEventListener("change", () => {
      btnSubmit.disabled = !chkConfirm.checked;
    });
  }

  if (bForm) {
    bForm.onsubmit = handleBookingSubmission;
  }
}

async function handleBookingSubmission(event) {
  event.preventDefault();
  const normPkg = normalisePackage(state.selectedPackage, state.searchPayload);
  if (!normPkg) return;

  const chkConfirm = document.getElementById("chkExplicitConfirm");
  if (!chkConfirm || !chkConfirm.checked) {
    alert("Explicit confirmation is required before proceeding.");
    return;
  }

  const nameInput = document.getElementById("travelerName");
  const emailInput = document.getElementById("travelerEmail");
  const phoneInput = document.getElementById("travelerPhone");
  const countInput = document.getElementById("travelerCount");
  const btnSubmit = document.getElementById("btnSubmitBooking");
  const receiptBox = document.getElementById("bookingReceiptBox");

  if (!nameInput.value.trim() || !emailInput.value.trim()) {
    alert("Please provide traveler full name and valid email address.");
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Processing simulated reservation...";

  const offerId = normPkg.package_id || `PKG-${Date.now()}`;
  const payload = {
    offer_id: String(offerId),
    confirm: true,
    customer: {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput ? phoneInput.value.trim() || null : null,
      passenger_count: countInput ? Number(countInput.value) || 1 : 1,
    },
    package_details: normPkg.raw || {},
  };

  try {
    const res = await confirmBooking(payload);
    if (res.success || res.status === "DUPLICATE_BOOKING") {
      receiptBox.hidden = false;
      renderBookingReceipt(receiptBox, res);
      loadBookingHistory();
    } else {
      receiptBox.hidden = false;
      receiptBox.innerHTML = `
        <div class="state-msg error-state" style="margin-top: 14px;">
          <p><strong>Booking Rejected:</strong> ${esc(res.message || "Reservation could not be made.")}</p>
        </div>`;
    }
  } catch (err) {
    receiptBox.hidden = false;
    receiptBox.innerHTML = `
      <div class="state-msg error-state" style="margin-top: 14px;">
        <p><strong>Booking Submission Error:</strong> ${esc(err.message)}</p>
      </div>`;
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Confirm Simulated Booking";
  }
}

// ================= PAGE 6: MY BOOKINGS CONTROLLER =================
async function loadBookingHistory() {
  if (!bookingHistoryEl) return;
  bookingHistoryEl.innerHTML = `<li class="muted">Loading recent simulated bookings...</li>`;
  try {
    const bookings = await fetchBookingHistory();
    if (bookings && bookings.length) {
      bookingHistoryEl.innerHTML = bookings
        .map(
          (b) => `
        <li>
          <div>
            <strong>${esc(b.booking_reference)} · ${esc(b.status)}</strong>
            <div class="muted">
              ${esc(b.customer_name)} (${esc(b.customer_email)}) · ${esc(b.passenger_count)} passenger(s) · ${formatINR(b.total_charged)}
            </div>
            <div style="font-size: 0.78rem; color: var(--gray-500); margin-top: 2px;">
              Created: ${new Date(b.created_at).toLocaleString("en-IN")} · Source: ${esc(b.data_source)}
            </div>
          </div>
          <div>
            <button class="btn btn-ghost btn-sm" data-booking-ref="${esc(b.booking_reference)}">View Details</button>
          </div>
        </li>`
        )
        .join("");
    } else {
      bookingHistoryEl.innerHTML = `<li class="muted">No simulated bookings created yet for your account. Complete a booking to see it listed here.</li>`;
    }
  } catch (err) {
    bookingHistoryEl.innerHTML = `<li class="muted">Unable to retrieve booking history (${esc(err.message)}).</li>`;
  }
}

// ================= PAGE 7: SEARCH HISTORY CONTROLLER =================
function getUserSearchHistoryKey() {
  const user = state.getUser();
  return user && user.id ? `concierge_searches_${user.id}` : "concierge_searches_anon";
}

function saveSearchToLocalHistory(payload, serverId = null) {
  const key = getUserSearchHistoryKey();
  const list = loadLocalSearchHistory();
  list.unshift({ ...payload, serverId, at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
}

function loadLocalSearchHistory() {
  const key = getUserSearchHistoryKey();
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function renderSearchHistory() {
  const list = loadLocalSearchHistory();
  if (!searchHistoryEl) return;
  searchHistoryEl.innerHTML = list.length
    ? list
        .map(
          (s, i) => `
        <li>
          <div>
            <strong>${esc(s.departure_city)} → ${esc(s.destination_city)}</strong>
            <div class="muted">${esc(s.departure_date)} – ${esc(s.return_date)} · ${esc(s.adults)} adult(s) · ${esc(s.preferred_hotel_stars || s.hotel_category)}★ · budget ${formatINR(s.budget)}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-ghost btn-sm" data-history="${i}">Load into Form</button>
            ${s.serverId ? `<button class="btn btn-primary btn-sm" data-replay-id="${esc(s.serverId)}">Replay</button>` : ""}
          </div>
        </li>`
        )
        .join("")
    : `<li class="muted">Your recent searches will appear here. Run a search to record your query history.</li>`;
}

function loadSearchIntoForm(s) {
  if (!s) return;
  const f = searchForm.elements;
  ["departure_city", "destination_city", "departure_date", "return_date", "adults", "budget"].forEach((k) => {
    if (f[k] && s[k] !== undefined) f[k].value = s[k];
  });
  if (f.hotel_category) {
    f.hotel_category.value = s.preferred_hotel_stars || s.hotel_category || "";
  }
  if (f.preferred_airline) f.preferred_airline.value = s.preferred_airline || "";
  if (f.max_stops) f.max_stops.value = s.max_flight_stops ?? s.max_stops ?? "";

  const selectedAmenities = s.preferred_amenities || s.amenities || [];
  searchForm.querySelectorAll('input[name="amenities"]').forEach((i) => {
    i.checked =
      selectedAmenities.includes(i.value) ||
      selectedAmenities.includes(AMENITY_MAP[i.value]);
  });

  router.navigate("#home");
}

// Global Event Listeners
function bindGlobalEvents() {
  // Auth Form submissions
  if (loginForm) loginForm.addEventListener("submit", handleLoginSubmit);
  if (registerForm) registerForm.addEventListener("submit", handleRegisterSubmit);

  // Password toggles
  if (toggleLoginPwd) {
    toggleLoginPwd.addEventListener("click", () => {
      const pwd = document.getElementById("login_password");
      if (pwd) {
        const isPwd = pwd.type === "password";
        pwd.type = isPwd ? "text" : "password";
        toggleLoginPwd.textContent = isPwd ? "Hide" : "Show";
      }
    });
  }

  if (toggleRegPwd) {
    toggleRegPwd.addEventListener("click", () => {
      const p1 = document.getElementById("reg_password");
      const p2 = document.getElementById("reg_confirm_password");
      if (p1 && p2) {
        const isPwd = p1.type === "password";
        p1.type = isPwd ? "text" : "password";
        p2.type = isPwd ? "text" : "password";
        toggleRegPwd.textContent = isPwd ? "Hide" : "Show";
      }
    });
  }

  // Logout triggers
  if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);
  if (profileLogoutBtn) profileLogoutBtn.addEventListener("click", handleLogout);

  // Search Form events
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit);
    searchForm.addEventListener("reset", () => {
      showErrors(searchForm, {});
      state.clearWorkflow();
    });

    if (searchForm.departure_date) {
      searchForm.departure_date.addEventListener("change", () => {
        searchForm.return_date.min = searchForm.departure_date.value || todayISO();
      });
    }
  }

  // Search history clicks
  if (searchHistoryEl) {
    searchHistoryEl.addEventListener("click", async (e) => {
      const loadBtn = e.target.closest("button[data-history]");
      if (loadBtn) {
        loadSearchIntoForm(loadLocalSearchHistory()[Number(loadBtn.dataset.history)]);
        return;
      }
      const replayBtn = e.target.closest("button[data-replay-id]");
      if (replayBtn) {
        const id = replayBtn.dataset.replayId;
        replayBtn.disabled = true;
        replayBtn.textContent = "Loading...";
        router.navigate("#results");
        renderLoading(resultsContainer);
        try {
          const data = await fetchRecommendationById(id);
          const searchContext = {
            departure_city: data.best_package?.outbound_flight?.origin_city || "Delhi",
            destination_city: data.best_package?.outbound_flight?.destination_city || "Mumbai",
            departure_date: data.best_package?.outbound_flight?.departure_time ? String(data.best_package.outbound_flight.departure_time).slice(0, 10) : todayISO(),
            return_date: data.best_package?.return_flight?.departure_time ? String(data.best_package.return_flight.departure_time).slice(0, 10) : todayISO(),
            adults: data.itemized_cost_breakdown?.adults || 1,
            budget: data.itemized_cost_breakdown?.budget || data.best_package?.total_cost || 50000,
          };
          state.setSearch(searchContext, data);
          renderResultsPageView();
        } catch (err) {
          renderError(resultsContainer, `Failed to replay recommendation ${id}: ${err.message}`);
        } finally {
          replayBtn.disabled = false;
          replayBtn.textContent = "Replay";
        }
      }
    });
  }

  // Booking history clicks
  if (bookingHistoryEl) {
    bookingHistoryEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-booking-ref]");
      if (!btn) return;
      const ref = btn.dataset.bookingRef;
      const card = btn.closest("li");
      
      let detailBox = card?.querySelector(".booking-lookup-details");
      if (detailBox) {
        detailBox.hidden = !detailBox.hidden;
        btn.textContent = detailBox.hidden ? "View Details" : "Hide Details";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Fetching...";
      try {
        const booking = await fetchBookingByReference(ref);
        detailBox = document.createElement("div");
        detailBox.className = "booking-lookup-details";
        detailBox.style.cssText = "margin-top: 10px; padding: 12px; background: var(--gray-50); border: 1px solid var(--gray-300); border-radius: var(--radius-sm); font-size: 0.88rem; width: 100%;";
        detailBox.innerHTML = `
          <div style="font-weight: 700; color: var(--navy-800); margin-bottom: 6px;">Live Reservation Record from Backend</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div><strong>Reference:</strong> <span style="font-family: monospace; color: var(--blue-500);">${esc(booking.booking_reference)}</span></div>
            <div><strong>Status:</strong> <span class="badge" style="background: var(--success);">${esc(booking.status)}</span></div>
            <div><strong>Customer:</strong> ${esc(booking.customer_name)} (${esc(booking.customer_email)})</div>
            <div><strong>Passengers:</strong> ${esc(booking.passenger_count)}</div>
            <div><strong>Total Charged:</strong> ${formatINR(booking.total_charged)}</div>
            <div><strong>Data Source:</strong> ${esc(booking.data_source)}</div>
            <div style="grid-column: 1 / -1;"><strong>Created:</strong> ${new Date(booking.created_at).toLocaleString("en-IN")}</div>
          </div>
          <div class="simulated-disclaimer" style="margin-top: 8px; margin-bottom: 0; font-size: 0.8rem;">
            Simulation Mode: No actual credit card was charged or flight ticket booked.
          </div>
        `;
        card.appendChild(detailBox);
        btn.textContent = "Hide Details";
      } catch (err) {
        alert(`Failed to fetch booking details for reference ${ref}: ${err.message}`);
        btn.textContent = "View Details";
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Refresh bookings button
  if (refreshBookingsBtn) {
    refreshBookingsBtn.addEventListener("click", () => {
      loadBookingHistory();
    });
  }

  // Mobile navigation toggle
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.tagName !== "A") return;
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }
}

async function init() {
  populateCities();
  const today = todayISO();
  if (searchForm && searchForm.departure_date) {
    searchForm.departure_date.min = today;
    searchForm.return_date.min = today;
  }
  bindGlobalEvents();

  // Validate active token on startup
  if (state.isAuthenticated()) {
    try {
      const user = await fetchMe();
      if (user) {
        state.setUser(user);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        state.clearAuth();
      }
    }
  }

  router.updateNavState();
  router.handleRoute();
}

init();

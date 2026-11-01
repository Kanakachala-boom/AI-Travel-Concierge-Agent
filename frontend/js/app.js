import { fetchRecommendations, ApiError } from "./api.js";
import { validateSearch, showErrors, todayISO } from "./validation.js";
import { renderLoading, renderError, renderResults, formatINR } from "./results.js";

const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata", "Pune", "Goa", "Jaipur", "Kochi", "Ahmedabad", "Lucknow"];
const HISTORY_KEY = "concierge_searches";

const form = document.getElementById("searchForm");
const submitBtn = document.getElementById("submitBtn");
const resultsEl = document.getElementById("results");
const historyEl = document.getElementById("searchHistory");
let isSubmitting = false;

function populateCities() {
  ["departure_city", "destination_city"].forEach((id) => {
    const select = document.getElementById(id);
    CITIES.forEach((c) => select.add(new Option(c, c)));
  });
}

function readForm() {
  const f = form.elements;
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
    amenities: [...form.querySelectorAll('input[name="amenities"]:checked')].map((i) => i.value),
  };
}

function toPayload(v) {
  return {
    departure_city: v.departure_city,
    destination_city: v.destination_city,
    departure_date: v.departure_date,
    return_date: v.return_date,
    adults: Number(v.adults),
    hotel_category: Number(v.hotel_category),
    budget: Number(v.budget),
    preferred_airline: v.preferred_airline || null,
    max_stops: v.max_stops === "" ? null : Number(v.max_stops),
    amenities: v.amenities,
  };
}

function setLoading(on) {
  isSubmitting = on;
  submitBtn.disabled = on;
  submitBtn.textContent = on ? "Searching..." : "Find Best Package";
}

function showResultsSection() {
  resultsEl.hidden = false;
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;
  const values = readForm();
  const errors = validateSearch(values);
  showErrors(form, errors);
  if (Object.keys(errors).length) return;

  const payload = toPayload(values);
  setLoading(true);
  renderLoading(resultsEl);
  showResultsSection();
  try {
    const data = await fetchRecommendations(payload);
    const found = renderResults(resultsEl, data, payload);
    saveHistory(payload, found);
    showResultsSection();
  } catch (err) {
    const detail = err instanceof ApiError && !err.network ? err.detail || err.message : null;
    renderError(resultsEl, detail);
  } finally {
    setLoading(false);
  }
}

function saveHistory(payload, found) {
  const list = loadHistory();
  list.unshift({ ...payload, found, at: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 8)));
  renderHistory();
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}

function renderHistory() {
  const list = loadHistory();
  historyEl.innerHTML = list.length
    ? list.map((s, i) => `
      <li>
        <div><strong>${s.departure_city} → ${s.destination_city}</strong>
        <div class="muted">${s.departure_date} – ${s.return_date} · ${s.adults} adult(s) · ${s.hotel_category}★ · budget ${formatINR(s.budget)}</div></div>
        <button class="btn btn-ghost btn-sm" data-history="${i}">Load search</button>
      </li>`).join("")
    : `<li class="muted">Your recent searches will appear here.</li>`;
}

function loadSearchIntoForm(s) {
  const f = form.elements;
  ["departure_city", "destination_city", "departure_date", "return_date", "adults", "hotel_category", "budget"].forEach((k) => (f[k].value = s[k]));
  f.preferred_airline.value = s.preferred_airline || "";
  f.max_stops.value = s.max_stops ?? "";
  form.querySelectorAll('input[name="amenities"]').forEach((i) => (i.checked = (s.amenities || []).includes(i.value)));
  document.getElementById("home").scrollIntoView({ behavior: "smooth" });
}

function bindEvents() {
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", () => {
    showErrors(form, {});
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
  });
  form.departure_date.addEventListener("change", () => {
    form.return_date.min = form.departure_date.value || todayISO();
  });

  resultsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "search-again") {
      document.getElementById("home").scrollIntoView({ behavior: "smooth" });
      form.elements.departure_city.focus({ preventScroll: true });
    }
    if (btn.dataset.action === "toggle-details") {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      const open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Hide Details" : "View Details";
    }
  });

  historyEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-history]");
    if (btn) loadSearchIntoForm(loadHistory()[Number(btn.dataset.history)]);
  });

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName !== "A") return;
    links.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a === e.target));
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function init() {
  populateCities();
  const today = todayISO();
  form.departure_date.min = today;
  form.return_date.min = today;
  bindEvents();
  renderHistory();
}

init();

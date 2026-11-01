// Rendering of recommendation results. Field access is tolerant of common
// naming variations so it adapts to the backend's response schema.
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (n) => (n == null || isNaN(Number(n)) ? "—" : inr.format(Number(n)));

const esc = (v) =>
  String(v ?? "—").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

function formatTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(v) {
  if (v == null) return "—";
  if (typeof v === "number") return `${Math.floor(v / 60)}h ${v % 60}m`;
  return v;
}

function stopsLabel(s) {
  if (s == null) return "—";
  return Number(s) === 0 ? "Non-stop" : `${s} stop${Number(s) > 1 ? "s" : ""}`;
}

/** Normalise a package object from the backend into a consistent shape. */
export function normalisePackage(pkg, search) {
  const adults = Number(pick(pkg, "adults", "travelers", "num_travelers") ?? search.adults);
  const out = pick(pkg, "outbound_flight", "outbound", "departure_flight", "flight_out") || {};
  const ret = pick(pkg, "return_flight", "inbound_flight", "return", "flight_return") || {};
  const hotel = pick(pkg, "hotel", "accommodation") || {};
  const nights =
    pick(pkg, "nights", "num_nights") ??
    pick(hotel, "nights") ??
    Math.max(0, Math.round((new Date(search.return_date) - new Date(search.departure_date)) / 86400000));
  const rooms = pick(hotel, "rooms", "num_rooms") ?? pick(pkg, "rooms", "num_rooms");

  const flightCost = (f) => {
    const per = pick(f, "price_per_adult", "price", "fare");
    return pick(f, "total_cost", "total_price") ?? (per != null ? per * adults : undefined);
  };
  const outCost = flightCost(out);
  const retCost = flightCost(ret);
  const hotelPerNight = pick(hotel, "price_per_night", "price_per_room_per_night", "price");
  const hotelCost =
    pick(pkg, "hotel_cost") ?? pick(hotel, "total_cost", "total_price") ??
    (hotelPerNight != null ? hotelPerNight * nights * (rooms || 1) : undefined);
  const flightTotal =
    pick(pkg, "flight_cost", "total_flight_cost") ??
    (outCost != null || retCost != null ? (outCost || 0) + (retCost || 0) : undefined);
  const total = pick(pkg, "total_cost", "total_price", "total") ?? ((flightTotal || 0) + (hotelCost || 0));

  return {
    rank: pick(pkg, "rank"),
    adults, nights, rooms, out, ret, hotel,
    outCost, retCost, hotelCost, hotelPerNight, flightTotal, total,
    remaining: pick(pkg, "remaining_budget") ?? Number(search.budget) - total,
    explanation: pick(pkg, "explanation", "reason", "reasoning"),
  };
}

function flightCard(title, f, cost, adults) {
  const from = pick(f, "departure_city", "origin", "from");
  const to = pick(f, "destination_city", "arrival_city", "destination", "to");
  return `
    <article class="card">
      <h3>${esc(title)} <span>${esc(pick(f, "airline"))} · ${esc(pick(f, "flight_number", "flight_no"))}</span></h3>
      <div class="route"><span>${esc(from)}</span><span class="line" aria-hidden="true"></span><span>${esc(to)}</span></div>
      <dl class="kv">
        <dt>Departure</dt><dd>${esc(formatTime(pick(f, "departure_time", "departs_at")))}</dd>
        <dt>Arrival</dt><dd>${esc(formatTime(pick(f, "arrival_time", "arrives_at")))}</dd>
        <dt>Duration</dt><dd>${esc(formatDuration(pick(f, "duration", "duration_minutes")))}</dd>
        <dt>Stops</dt><dd>${esc(stopsLabel(pick(f, "stops", "num_stops")))}</dd>
        <dt>Price / adult</dt><dd>${formatINR(pick(f, "price_per_adult", "price", "fare"))}</dd>
        <dt>Total (${adults} adult${adults > 1 ? "s" : ""})</dt><dd>${formatINR(cost)}</dd>
      </dl>
    </article>`;
}

function hotelCard(p) {
  const h = p.hotel;
  const stars = Number(pick(h, "category", "star_rating", "stars")) || 0;
  const amenities = pick(h, "amenities") || [];
  return `
    <article class="card">
      <h3>Hotel <span>${"★".repeat(stars)} ${stars ? `${stars}-star` : ""}</span></h3>
      <div class="route">${esc(pick(h, "name", "hotel_name"))}</div>
      <dl class="kv">
        <dt>Location</dt><dd>${esc(pick(h, "location", "city", "address"))}</dd>
        <dt>Rating</dt><dd>${esc(pick(h, "rating", "guest_rating") ?? `${stars} star`)}</dd>
        <dt>Price / room / night</dt><dd>${formatINR(p.hotelPerNight)}</dd>
        <dt>Nights</dt><dd>${esc(p.nights)}</dd>
        <dt>Rooms</dt><dd>${esc(p.rooms ?? "—")}</dd>
        <dt>Total hotel cost</dt><dd>${formatINR(p.hotelCost)}</dd>
      </dl>
      ${amenities.length ? `<ul class="amenity-list">${amenities.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
    </article>`;
}

function breakdownCard(p) {
  return `
    <article class="card">
      <h3>Cost Breakdown</h3>
      <ul class="breakdown">
        <li><span>Flight Cost</span><span>${formatINR(p.flightTotal)}</span></li>
        <li><span>Hotel Cost</span><span>${formatINR(p.hotelCost)}</span></li>
        <li class="total-row"><span>Total Estimated Cost</span><span>${formatINR(p.total)}</span></li>
        <li class="remaining"><span>Remaining Budget</span><span>${formatINR(p.remaining)}</span></li>
      </ul>
    </article>`;
}

function detailsHTML(p) {
  return flightCard("Outbound Flight", p.out, p.outCost, p.adults) +
    flightCard("Return Flight", p.ret, p.retCost, p.adults) +
    hotelCard(p) + breakdownCard(p);
}

export function renderLoading(container) {
  container.innerHTML = `
    <div class="loading" role="status">
      <div class="spinner" aria-hidden="true"></div>
      <p><strong>AI Agent is analyzing flight and hotel combinations...</strong></p>
    </div>`;
}

export function renderError(container, detail) {
  container.innerHTML = `
    <div class="state-msg error-state" role="alert">
      <p><strong>Unable to connect to the travel recommendation service. Please ensure the backend server is running and try again.</strong></p>
      ${detail ? `<p>${esc(detail)}</p>` : ""}
      <p><button class="btn btn-ghost btn-sm" data-action="search-again">Search Again</button></p>
    </div>`;
}

export function renderEmpty(container, explanation) {
  container.innerHTML = `
    <div class="state-msg empty-state">
      <p><strong>No valid travel package satisfies your current requirements.</strong></p>
      ${explanation ? `<p>${esc(explanation)}</p>` : ""}
      <p><button class="btn btn-ghost btn-sm" data-action="search-again">Search Again</button></p>
    </div>`;
}

/** Extract best + alternatives from the backend response. */
export function parseResponse(data) {
  if (!data) return { best: null, alternatives: [], explanation: null };
  const list = Array.isArray(data) ? data : pick(data, "packages", "recommendations", "results");
  let best = pick(data, "best_package", "best", "recommended_package", "recommendation");
  let alternatives = pick(data, "alternatives", "alternative_packages") || [];
  if (!best && Array.isArray(list) && list.length) {
    best = list[0];
    if (!alternatives.length) alternatives = list.slice(1);
  }
  alternatives = [...alternatives].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 3);
  return { best, alternatives, explanation: pick(data, "explanation", "message", "reason") };
}

export function renderResults(container, data, search) {
  const { best, alternatives, explanation } = parseResponse(data);
  if (!best || (data && data.success === false)) {
    renderEmpty(container, explanation);
    return false;
  }
  const p = normalisePackage(best, search);
  const why = p.explanation || explanation;

  container.innerHTML = `
    <div class="section-head">
      <h2>Your AI-curated trip to ${esc(search.destination_city)}</h2>
      <button class="btn btn-ghost btn-sm" data-action="search-again">Search Again</button>
    </div>
    <section class="best" aria-label="Best recommended package">
      <div class="best-summary">
        <div><span class="badge">Best Recommended Package</span><div class="total">${formatINR(p.total)}</div></div>
        <div class="stat"><small>Travelers</small><strong>${p.adults} adult${p.adults > 1 ? "s" : ""}</strong></div>
        <div class="stat"><small>Nights</small><strong>${esc(p.nights)}</strong></div>
        <div class="stat"><small>Destination</small><strong>${esc(search.destination_city)}</strong></div>
        <div class="stat"><small>Dates</small><strong>${esc(search.departure_date)} → ${esc(search.return_date)}</strong></div>
      </div>
      <div class="best-body">
        ${detailsHTML(p)}
        ${why ? `<article class="card explanation"><h3>AI Agent Explanation</h3><p>${esc(why)}</p></article>` : ""}
      </div>
    </section>
    <h2 class="alts-title">Alternative Packages</h2>
    ${alternatives.length ? `<div class="alts">${alternatives.map((a, i) => altCard(normalisePackage(a, search), i)).join("")}</div>`
      : `<div class="state-msg empty-state"><p>No alternative packages were returned for this search.</p></div>`}
  `;
  return true;
}

function altCard(p, i) {
  const id = `alt-details-${i}`;
  return `
    <article class="alt">
      <div class="alt-head"><span class="rank">Rank #${esc(p.rank ?? i + 2)}</span><span class="alt-total">${formatINR(p.total)}</span></div>
      <p>✈ ${esc(pick(p.out, "airline"))} ${esc(pick(p.out, "flight_number", "flight_no"))} · ${esc(stopsLabel(pick(p.out, "stops", "num_stops")))}</p>
      <p>↩ ${esc(pick(p.ret, "airline"))} ${esc(pick(p.ret, "flight_number", "flight_no"))} · ${esc(stopsLabel(pick(p.ret, "stops", "num_stops")))}</p>
      <p>🏨 ${esc(pick(p.hotel, "name", "hotel_name"))} · ${esc(pick(p.hotel, "category", "star_rating", "stars"))}★ · ${esc(p.nights)} nights</p>
      <p>Flights ${formatINR(p.flightTotal)} · Hotel ${formatINR(p.hotelCost)}</p>
      <button class="btn btn-ghost btn-sm" data-action="toggle-details" aria-expanded="false" aria-controls="${id}">View Details</button>
      <div class="alt-details" id="${id}" hidden>${detailsHTML(p)}</div>
    </article>`;
}

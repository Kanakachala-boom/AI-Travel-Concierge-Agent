// Rendering of all 7 multi-page routed views and components
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (n) => (n == null || isNaN(Number(n)) ? "—" : inr.format(Number(n)));

export const esc = (v) =>
  String(v ?? "—").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

function formatTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(v) {
  if (v == null) return "—";
  if (typeof v === "number") return `${Math.floor(v / 60)}h ${v % 60}m`;
  return String(v);
}

function stopsLabel(s) {
  if (s == null) return "—";
  return Number(s) === 0 ? "Non-stop" : `${s} stop${Number(s) > 1 ? "s" : ""}`;
}

/** Normalise a package object into a standard model */
export function normalisePackage(pkg, search) {
  if (!pkg) return null;
  const adults = Number(pick(pkg, "adults", "travelers", "num_travelers", "num_adults") ?? (search && search.adults) ?? 1);
  const out = pick(pkg, "outbound_flight", "outbound", "departure_flight", "flight_out") || {};
  const ret = pick(pkg, "return_flight", "inbound_flight", "return", "flight_return") || {};
  const hotel = pick(pkg, "hotel", "accommodation") || {};
  const nights =
    pick(pkg, "nights", "num_nights") ??
    pick(hotel, "nights") ??
    (search && search.departure_date && search.return_date
      ? Math.max(1, Math.round((new Date(search.return_date) - new Date(search.departure_date)) / 86400000))
      : 1);
  const rooms = pick(hotel, "rooms", "num_rooms") ?? pick(pkg, "rooms_required", "rooms", "num_rooms") ?? 1;

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

  const package_id = pick(pkg, "package_id", "id") || `PKG-${pick(out, "flight_number") || pick(out, "id")}-${pick(ret, "flight_number") || pick(ret, "id")}-${pick(hotel, "id")}`;

  return {
    raw: pkg,
    package_id,
    rank: pick(pkg, "rank"),
    adults,
    nights,
    rooms,
    out,
    ret,
    hotel,
    outCost,
    retCost,
    hotelCost,
    hotelPerNight,
    flightTotal,
    total,
    remaining: pick(pkg, "remaining_budget") ?? ((search && search.budget) ? Number(search.budget) - total : 0),
    explanation: pick(pkg, "explanation", "reason", "reasoning"),
    convenience_score: pick(pkg, "convenience_score", "score"),
    soft_penalties: pick(pkg, "soft_penalties") || [],
  };
}

export function flightCard(title, f, cost, adults) {
  const from = pick(f, "origin_city", "departure_city", "origin", "from");
  const to = pick(f, "destination_city", "arrival_city", "destination", "to");
  return `
    <article class="card">
      <h3>${esc(title)} <span>${esc(pick(f, "airline"))} · ${esc(pick(f, "flight_number", "flight_no"))}</span></h3>
      <div class="route"><span>${esc(from)}</span><span class="line" aria-hidden="true"></span><span>${esc(to)}</span></div>
      <dl class="kv">
        <dt>Departure</dt><dd>${esc(formatTime(pick(f, "departure_time", "departs_at")))}</dd>
        <dt>Arrival</dt><dd>${esc(formatTime(pick(f, "arrival_time", "arrives_at")))}</dd>
        <dt>Duration</dt><dd>${esc(formatDuration(pick(f, "duration_minutes", "duration")))}</dd>
        <dt>Stops</dt><dd>${esc(stopsLabel(pick(f, "stops", "num_stops")))}</dd>
        <dt>Price / adult</dt><dd>${formatINR(pick(f, "price_per_adult", "price", "fare"))}</dd>
        <dt>Total (${adults} adult${adults > 1 ? "s" : ""})</dt><dd>${formatINR(cost)}</dd>
      </dl>
    </article>`;
}

export function hotelCard(p) {
  const h = p.hotel;
  const stars = Number(pick(h, "star_rating", "category", "stars")) || 0;
  const amenities = pick(h, "amenities") || [];
  return `
    <article class="card">
      <h3>Hotel <span>${"★".repeat(stars)} ${stars ? `${stars}-star` : ""}</span></h3>
      <div class="route">${esc(pick(h, "name", "hotel_name"))}</div>
      <dl class="kv">
        <dt>Location</dt><dd>${esc(pick(h, "city", "location", "address"))}</dd>
        <dt>Rating</dt><dd>${esc(pick(h, "rating", "guest_rating") ?? `${stars} star`)}</dd>
        <dt>Price / room / night</dt><dd>${formatINR(p.hotelPerNight)}</dd>
        <dt>Nights</dt><dd>${esc(p.nights)}</dd>
        <dt>Rooms</dt><dd>${esc(p.rooms ?? 1)}</dd>
        <dt>Total hotel cost</dt><dd>${formatINR(p.hotelCost)}</dd>
      </dl>
      ${amenities.length ? `<ul class="amenity-list">${amenities.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
    </article>`;
}

export function breakdownCard(p) {
  return `
    <article class="card">
      <h3>Itemized Cost Breakdown</h3>
      <ul class="breakdown">
        <li><span>Outbound & Return Flights</span><span>${formatINR(p.flightTotal)}</span></li>
        <li><span>Hotel Accommodation (${p.nights} night(s), ${p.rooms} room(s))</span><span>${formatINR(p.hotelCost)}</span></li>
        <li class="total-row"><span>Total Package Cost</span><span>${formatINR(p.total)}</span></li>
        <li class="remaining"><span>Remaining Within Budget</span><span>${formatINR(p.remaining)}</span></li>
      </ul>
    </article>`;
}

export function renderLoading(container) {
  container.innerHTML = `
    <div class="loading" role="status">
      <div class="spinner" aria-hidden="true"></div>
      <p><strong>AI Concierge Agent is analyzing flight and hotel combinations...</strong></p>
      <p style="color: var(--color-muted); font-size: 0.88rem; margin-top: 6px;">
        Executing 7-stage cognitive pipeline: Perception, Goal Formulation, Candidate Generation, Constraint Satisfaction, Cost Optimization & Explainability.
      </p>
    </div>`;
}

export function renderError(container, detail) {
  container.innerHTML = `
    <div class="state-msg error-state" role="alert">
      <p><strong>Unable to communicate with the travel recommendation service.</strong></p>
      ${detail ? `<p style="font-family: monospace; font-size: 0.85rem; margin-top: 8px;">${esc(detail)}</p>` : ""}
      <p style="margin-top: 14px;"><a href="#home" class="btn btn-ghost btn-sm">Return to Search Form</a></p>
    </div>`;
}

export function renderEmpty(container, explanation, data = {}) {
  const suggestions = data.actionable_suggestions || [];
  const rejection = data.rejection_summary || {};
  const hasRejections = Object.values(rejection).some((v) => typeof v === "number" && v > 0);

  let suggestionsHTML = "";
  if (suggestions.length) {
    suggestionsHTML = `
      <div class="diagnostics-box" style="text-align: left; margin: 16px auto; max-width: 600px;">
        <h4 style="color: var(--navy-800); margin-bottom: 6px;">💡 AI Concierge Suggestions:</h4>
        <ul class="suggestions-list">
          ${suggestions.map((s) => `<li>${esc(s)}</li>`).join("")}
        </ul>
      </div>`;
  }

  let rejectionHTML = "";
  if (hasRejections) {
    const reasons = [];
    if (rejection.budget_exceeded) reasons.push(`${rejection.budget_exceeded} combinations exceeded total budget`);
    if (rejection.stops_exceeded) reasons.push(`${rejection.stops_exceeded} exceeded maximum stops`);
    if (rejection.hotel_stars_mismatch) reasons.push(`${rejection.hotel_stars_mismatch} did not match hotel star rating`);
    if (rejection.amenities_missing) reasons.push(`${rejection.amenities_missing} lacked mandatory amenities`);
    if (rejection.insufficient_flight_seats) reasons.push(`${rejection.insufficient_flight_seats} had insufficient flight seats`);
    if (rejection.insufficient_hotel_rooms) reasons.push(`${rejection.insufficient_hotel_rooms} had insufficient hotel rooms`);

    if (reasons.length) {
      rejectionHTML = `
        <div class="diagnostics-box" style="text-align: left; margin: 12px auto; max-width: 600px; font-size: 0.85rem; color: var(--color-muted);">
          <strong>Constraint Evaluation Summary:</strong>
          <ul style="margin: 6px 0 0 18px;">
            ${reasons.map((r) => `<li>${esc(r)}</li>`).join("")}
          </ul>
        </div>`;
    }
  }

  container.innerHTML = `
    <div class="state-msg empty-state">
      <p><strong>No valid travel package satisfies your current requirements.</strong></p>
      ${explanation ? `<p style="margin-top: 6px;">${esc(explanation)}</p>` : ""}
      ${suggestionsHTML}
      ${rejectionHTML}
      <p style="margin-top: 14px;"><a href="#home" class="btn btn-ghost btn-sm">Modify Search Parameters</a></p>
    </div>`;
}

/** Parse FastAPI backend response */
export function parseResponse(data) {
  if (!data) return { best: null, alternatives: [], explanation: null, suggestions: [], rejection: {} };
  const list = Array.isArray(data) ? data : pick(data, "packages", "recommendations", "results");
  let best = pick(data, "best_package", "best", "recommended_package", "recommendation");
  let alternatives = pick(data, "alternative_packages", "alternatives") || [];
  if (!best && Array.isArray(list) && list.length) {
    best = list[0];
    if (!alternatives.length) alternatives = list.slice(1);
  }
  alternatives = [...alternatives].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 3);
  return {
    best,
    alternatives,
    explanation: pick(data, "explanation", "message", "reason"),
    suggestions: pick(data, "actionable_suggestions") || [],
    rejection: pick(data, "rejection_summary") || {},
  };
}

/** Render PAGE 2: Search Results */
export function renderResults(container, data, search) {
  const { best, alternatives, explanation, suggestions, rejection } = parseResponse(data);
  if (!best || (data && data.status === "NO_FEALSIBLE_PACKAGE") || (data && data.status === "NO_FEASIBLE_PACKAGE") || (data && data.success === false)) {
    renderEmpty(container, explanation, { actionable_suggestions: suggestions, rejection_summary: rejection });
    return false;
  }

  const p = normalisePackage(best, search);
  const why = p.explanation || explanation;

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Your AI-Curated Packages for ${esc(search.destination_city)}</h2>
        <p style="color: var(--gray-500); font-size: 0.95rem; margin-top: 4px;">
          ${esc(search.departure_city)} → ${esc(search.destination_city)} · ${esc(search.departure_date)} to ${esc(search.return_date)} · ${p.adults} adult(s) · Budget ${formatINR(search.budget)}
        </p>
      </div>
      <a href="#home" class="btn btn-ghost btn-sm">Modify Search</a>
    </div>

    <!-- Best Recommended Package Card -->
    <section class="best" aria-label="Best recommended package">
      <div class="best-summary">
        <div>
          <span class="badge">Best Recommended Package</span>
          <div class="total">${formatINR(p.total)}</div>
        </div>
        <div class="stat"><small>Travelers</small><strong>${p.adults} adult${p.adults > 1 ? "s" : ""}</strong></div>
        <div class="stat"><small>Nights</small><strong>${esc(p.nights)}</strong></div>
        <div class="stat"><small>Destination</small><strong>${esc(search.destination_city)}</strong></div>
        <div class="stat"><small>Dates</small><strong>${esc(search.departure_date)} → ${esc(search.return_date)}</strong></div>
        <div style="grid-column: 1 / -1; margin-top: 12px; display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-primary" data-action="view-details" data-pkg-type="best">
            Select & View Package Details ›
          </button>
        </div>
      </div>
      <div class="best-body">
        ${flightCard("Outbound Flight", p.out, p.outCost, p.adults)}
        ${flightCard("Return Flight", p.ret, p.retCost, p.adults)}
        ${hotelCard(p)}
        ${breakdownCard(p)}
        ${why ? `<article class="card explanation" style="grid-column: 1 / -1;"><h3>AI Agent Reasoning & Constraints Satisfaction</h3><p>${esc(why)}</p></article>` : ""}
      </div>
    </section>

    <!-- Alternative Packages Section -->
    <h2 class="alts-title">Alternative Packages Evaluated</h2>
    ${
      alternatives.length
        ? `<div class="alts">${alternatives.map((a, i) => altCard(normalisePackage(a, search), i)).join("")}</div>`
        : `<div class="state-msg empty-state"><p>No additional alternatives met all hard constraints within your budget.</p></div>`
    }
  `;
  return true;
}

function altCard(p, i) {
  return `
    <article class="alt">
      <div class="alt-head">
        <span class="rank">Rank #${esc(p.rank ?? i + 2)}</span>
        <span class="alt-total">${formatINR(p.total)}</span>
      </div>
      <p>✈ ${esc(pick(p.out, "airline"))} ${esc(pick(p.out, "flight_number", "flight_no"))} · ${esc(stopsLabel(pick(p.out, "stops", "num_stops")))}</p>
      <p>↩ ${esc(pick(p.ret, "airline"))} ${esc(pick(p.ret, "flight_number", "flight_no"))} · ${esc(stopsLabel(pick(p.ret, "stops", "num_stops")))}</p>
      <p>🏨 ${esc(pick(p.hotel, "name", "hotel_name"))} · ${esc(pick(p.hotel, "star_rating", "category", "stars"))}★ · ${esc(p.nights)} nights</p>
      <p>Flights ${formatINR(p.flightTotal)} · Hotel ${formatINR(p.hotelCost)}</p>
      <div style="margin-top: 12px;">
        <button class="btn btn-secondary btn-sm" style="width: 100%;" data-action="view-details" data-pkg-type="alt" data-pkg-index="${i}">
          Select & View Details ›
        </button>
      </div>
    </article>`;
}

/** Render PAGE 3: Package Details */
export function renderPackageDetails(container, p, search) {
  if (!p) {
    container.innerHTML = `
      <div class="state-msg empty-state">
        <p><strong>No travel package selected.</strong></p>
        <p>Please select a package from the search results first.</p>
        <p style="margin-top: 12px;"><a href="#results" class="btn btn-primary btn-sm">Go to Search Results</a></p>
      </div>`;
    return;
  }

  const label = p.rank ? `Package (Rank #${p.rank})` : "Best Recommended Package";

  container.innerHTML = `
    <div class="page-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2>${label}</h2>
          <p>Complete itinerary and itemized cost breakdown for your trip to ${esc(search.destination_city)}.</p>
        </div>
        <div style="text-align: right;">
          <span class="badge" style="background: var(--navy-800); font-size: 0.85rem; padding: 6px 14px;">Total: ${formatINR(p.total)}</span>
        </div>
      </div>
    </div>

    <div class="best-body" style="padding: 0; margin-bottom: 24px;">
      ${flightCard("Outbound Flight", p.out, p.outCost, p.adults)}
      ${flightCard("Return Flight", p.ret, p.retCost, p.adults)}
      ${hotelCard(p)}
      ${breakdownCard(p)}
      <article class="card explanation" style="grid-column: 1 / -1;">
        <h3>AI Agent Evaluation & Explainability</h3>
        <p>${esc(p.explanation || "This package satisfied all hard constraints and achieved the top score across travel duration, stop count, and accommodation quality.")}</p>
        ${p.convenience_score ? `<p style="margin-top: 8px; font-weight: 600; color: var(--navy-800);">Convenience Score: ${p.convenience_score}</p>` : ""}
      </article>
    </div>

    <div class="action-bar">
      <a href="#results" class="btn btn-ghost">← Back to Results</a>
      <button class="btn btn-primary" data-action="proceed-to-verify">
        Proceed to Offer Verification ›
      </button>
    </div>
  `;
}

/** Render PAGE 4: Offer Verification */
export function renderVerificationView(container, p, verifyState = null) {
  if (!p) {
    container.innerHTML = `
      <div class="state-msg empty-state">
        <p><strong>No travel package selected for verification.</strong></p>
        <p><a href="#home" class="btn btn-primary btn-sm">Start New Trip Search</a></p>
      </div>`;
    return;
  }

  const isVerified = verifyState && verifyState.verified;
  const isRepriced = verifyState && verifyState.status === "OFFER_REPRICED";

  let statusHTML = "";
  if (verifyState) {
    if (isVerified) {
      statusHTML = `
        <div class="verify-status verified">
          <strong>✓ Offer Revalidated & Confirmed:</strong>
          <p>${esc(verifyState.message || "Provider seat and room inventory confirmed.")}</p>
          <p style="margin-top: 6px;">Verified Fare: <strong>${formatINR(verifyState.current_price ?? p.total)}</strong>.</p>
        </div>`;
    } else if (isRepriced) {
      statusHTML = `
        <div class="verify-status repriced">
          <strong>⚠️ Fare Repriced by Provider:</strong>
          <p>${esc(verifyState.message)}</p>
          <p style="margin-top: 6px;">New Total Price: <strong>${formatINR(verifyState.current_price)}</strong> (Difference: ${formatINR(verifyState.price_difference)}).</p>
          <label style="display: flex; gap: 8px; align-items: center; margin-top: 10px; cursor: pointer; font-weight: 600;">
            <input type="checkbox" id="chkAcceptReprice" /> I accept the updated fare of ${formatINR(verifyState.current_price)}.
          </label>
        </div>`;
    } else {
      statusHTML = `
        <div class="verify-status expired">
          <strong>❌ Offer Expired / Unavailable:</strong>
          <p>${esc(verifyState.message || "Selected flight seats or hotel rooms are no longer available in provider inventory.")}</p>
          <p style="margin-top: 10px;"><a href="#results" class="btn btn-ghost btn-sm">Select Another Package</a></p>
        </div>`;
    }
  }

  container.innerHTML = `
    <div class="page-header">
      <h2>Step 4: Real-Time Offer Verification</h2>
      <p>Before confirming your reservation, the AI agent checks real-time seat and room availability to ensure fares and inventory are not stale.</p>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem; color: var(--navy-800);">Selected Itinerary Snapshot</h3>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 10px;">
        <div>
          <strong>${esc(pick(p.out, "origin_city"))} ✈ ${esc(pick(p.out, "destination_city"))}</strong>
          <div style="font-size: 0.88rem; color: var(--gray-500); margin-top: 4px;">
            Hotel: ${esc(pick(p.hotel, "name"))} (${esc(pick(p.hotel, "star_rating"))}★) · ${p.adults} adult(s)
          </div>
        </div>
        <div style="font-size: 1.3rem; font-weight: 700; color: var(--navy-800);">
          Quoted: ${formatINR(p.total)}
        </div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <button class="btn btn-primary" id="btnRunVerification">
        🔍 Verify Live Offer with Provider
      </button>
      <div id="verifyStatusBox">${statusHTML}</div>
    </div>

    <div class="action-bar">
      <a href="#details" class="btn btn-ghost">← Back to Package Details</a>
      <button class="btn btn-primary" id="btnContinueToBooking" ${isVerified || isRepriced ? "" : "disabled"}>
        Proceed to Traveler Booking ›
      </button>
    </div>
  `;
}

/** Render PAGE 5: Booking */
export function renderBookingView(container, p, verifyState) {
  if (!p) {
    container.innerHTML = `
      <div class="state-msg empty-state">
        <p><strong>No verified package ready for booking.</strong></p>
        <p><a href="#home" class="btn btn-primary btn-sm">Start New Trip Search</a></p>
      </div>`;
    return;
  }

  const finalPrice = (verifyState && verifyState.current_price) ? verifyState.current_price : p.total;

  container.innerHTML = `
    <div class="page-header">
      <h2>Step 5: Traveler Details & Simulated Booking Confirmation</h2>
      <p>Please provide traveler contact details and confirm the creation of your simulated reservation.</p>
    </div>

    <div class="simulated-disclaimer">
      <strong>⚠️ Educational Demonstration Notice:</strong>
      Automated E-Commerce Concierge Agent operates in educational simulation mode. No live credit card charge or legal ticketing will take place.
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <span class="badge" style="background: var(--success);">Verified Offer Active</span>
          <strong style="margin-left: 8px; font-size: 1.05rem;">${esc(pick(p.out, "origin_city"))} → ${esc(pick(p.out, "destination_city"))}</strong>
        </div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--navy-800);">
          ${formatINR(finalPrice)}
        </div>
      </div>
    </div>

    <form id="bookingForm" class="booking-form" novalidate>
      <div class="field">
        <label for="travelerName">Primary Traveler Full Name *</label>
        <input type="text" id="travelerName" required value="Aditi Sharma" placeholder="e.g. John Doe" />
      </div>
      <div class="field">
        <label for="travelerEmail">Contact Email Address *</label>
        <input type="email" id="travelerEmail" required value="aditi.sharma@example.com" placeholder="name@example.com" />
      </div>
      <div class="field">
        <label for="travelerPhone">Phone Number <span class="opt">(optional)</span></label>
        <input type="tel" id="travelerPhone" value="+91 98765 43210" placeholder="+91 98765 43210" />
      </div>
      <div class="field">
        <label for="travelerCount">Passenger Count</label>
        <input type="number" id="travelerCount" readonly value="${p.adults}" />
      </div>

      <div class="field-full">
        <label class="confirmation-checkbox" for="chkExplicitConfirm">
          <input type="checkbox" id="chkExplicitConfirm" required />
          <span>I have reviewed this trip itinerary and explicitly confirm creating this <strong>simulated travel reservation</strong>.</span>
        </label>
      </div>

      <div class="field-full" style="margin-top: 10px;">
        <button type="submit" class="btn btn-primary" id="btnSubmitBooking" disabled>
          Confirm Simulated Booking
        </button>
      </div>
    </form>

    <div id="bookingReceiptBox" hidden style="margin-top: 24px;"></div>

    <div class="action-bar" style="margin-top: 28px;">
      <a href="#verify" class="btn btn-ghost">← Back to Verification</a>
      <a href="#my-bookings" class="btn btn-ghost btn-sm">Go to My Bookings</a>
    </div>
  `;
}

/** Render Booking Receipt Card */
export function renderBookingReceipt(container, booking) {
  const isDuplicate = booking.status === "DUPLICATE_BOOKING";
  const ref = booking.booking_reference || "SIM-RES-SAMPLE";
  const charged = booking.total_charged != null ? formatINR(booking.total_charged) : "—";
  const titleText = isDuplicate ? "Existing Reservation Retrieved" : "Simulated Booking Confirmed!";
  const statusColor = isDuplicate ? "#d97706" : "var(--success)";
  const icon = isDuplicate ? "ℹ️" : "✓";

  container.innerHTML = `
    <div class="booking-success-box" role="status" style="${isDuplicate ? 'border-color: #f59e0b;' : ''}">
      <div style="display: flex; align-items: center; gap: 8px; color: ${statusColor}; font-weight: 700; font-size: 1.15rem; margin-bottom: 8px;">
        <span>${icon}</span>
        <span>${titleText}</span>
      </div>
      <p style="color: var(--navy-800); font-size: 0.95rem; margin-bottom: 12px;">
        ${isDuplicate ? "This package was already reserved earlier. Existing reservation reference is active." : "Your travel reservation has been simulated and saved to the database."}
      </p>

      <div class="ref-code-box">
        <div class="label">Booking Reference Code</div>
        <div class="code">${esc(ref)}</div>
      </div>

      <dl class="kv" style="grid-template-columns: 1fr 1fr; margin-top: 12px;">
        <dt>Primary Traveler</dt><dd><strong>${esc(booking.customer_name || "—")}</strong></dd>
        <dt>Status</dt><dd><span class="badge" style="background: ${statusColor};">${esc(booking.status || "CONFIRMED")}</span></dd>
        <dt>Total Amount</dt><dd><strong>${charged}</strong></dd>
        <dt>Data Source</dt><dd>${esc(booking.data_source || "SIMULATED")}</dd>
      </dl>

      <div class="simulated-disclaimer" style="margin-top: 14px; margin-bottom: 0;">
        ${esc(booking.disclaimer || "Demonstration reservation only. No actual booking or payment was made.")}
      </div>

      <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="#my-bookings" class="btn btn-primary btn-sm">View in My Bookings</a>
        <a href="#home" class="btn btn-ghost btn-sm">Plan Another Trip</a>
      </div>
    </div>
  `;
  container.hidden = false;
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

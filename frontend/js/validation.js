// Input validation for the travel search form.
const VALID_CATEGORIES = ["1", "2", "3", "4", "5"];

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function validateSearch(values) {
  const errors = {};
  const required = {
    departure_city: "Please select a departure city.",
    destination_city: "Please select a destination city.",
    departure_date: "Please choose a departure date.",
    return_date: "Please choose a return date.",
    adults: "Please enter the number of travelers.",
    hotel_category: "Please select a hotel category.",
    budget: "Please enter your maximum budget.",
  };
  for (const [key, msg] of Object.entries(required)) {
    if (values[key] === "" || values[key] == null) errors[key] = msg;
  }

  if (!errors.destination_city && values.departure_city && values.departure_city === values.destination_city) {
    errors.destination_city = "Destination must be different from departure city.";
  }
  if (!errors.departure_date && values.departure_date < todayISO()) {
    errors.departure_date = "Departure date cannot be in the past.";
  }
  if (!errors.return_date && values.departure_date && values.return_date < values.departure_date) {
    errors.return_date = "Return date cannot be before departure date.";
  }
  if (!errors.adults && (!Number.isInteger(Number(values.adults)) || Number(values.adults) < 1)) {
    errors.adults = "At least one adult traveler is required.";
  }
  if (!errors.budget && !(Number(values.budget) > 0)) {
    errors.budget = "Budget must be a positive amount.";
  }
  if (!errors.hotel_category && !VALID_CATEGORIES.includes(String(values.hotel_category))) {
    errors.hotel_category = "Please choose a valid hotel category.";
  }
  return errors;
}

export function showErrors(form, errors) {
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));
  form.querySelectorAll(".error").forEach((e) => (e.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  for (const [key, msg] of Object.entries(errors)) {
    const input = form.elements[key];
    const errEl = form.querySelector(`#err-${key}`);
    if (errEl) errEl.textContent = msg;
    if (input && input.closest) {
      input.closest(".field")?.classList.add("invalid");
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", `err-${key}`);
    }
  }
  const first = Object.keys(errors)[0];
  if (first) form.elements[first]?.focus();
}

export { todayISO };

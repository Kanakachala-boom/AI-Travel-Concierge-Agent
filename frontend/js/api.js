// Backend communication with the FastAPI travel recommendation service.
export const API_BASE_URL =
  new URLSearchParams(window.location.search).get("api") ||
  localStorage.getItem("concierge_api_url") ||
  "http://localhost:8000";

const RECOMMENDATION_ENDPOINT = "/api/recommendations";

export class ApiError extends Error {
  constructor(message, { status = 0, detail = null, network = false } = {}) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.network = network;
  }
}

function extractDetail(body) {
  if (!body) return null;
  if (typeof body === "string") return body;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    // FastAPI / Pydantic validation errors
    return body.detail.map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`).join("\n");
  }
  return body.message || body.error || null;
}

export async function fetchRecommendations(payload, { timeoutMs = 60000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${RECOMMENDATION_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError("Network failure", { network: true, detail: err.message });
  } finally {
    clearTimeout(timer);
  }

  let body = null;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, {
      status: response.status,
      detail: extractDetail(body),
    });
  }
  return body;
}

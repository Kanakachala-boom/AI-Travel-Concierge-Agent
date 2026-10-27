import type {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationHistoryItem,
  FlightDTO,
  HotelDTO,
} from '../types';

const API_BASE = '/api';

export async function fetchRecommendations(req: RecommendationRequest): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchRecommendationById(id: string): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE}/recommendations/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch search ${id}`);
  }
  return response.json();
}

export async function fetchRecommendationHistory(): Promise<RecommendationHistoryItem[]> {
  try {
    const response = await fetch(`${API_BASE}/recommendations/history?limit=6`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function fetchFlights(origin?: string, destination?: string): Promise<FlightDTO[]> {
  const params = new URLSearchParams();
  if (origin) params.append('origin', origin);
  if (destination) params.append('destination', destination);
  const response = await fetch(`${API_BASE}/flights?${params.toString()}`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchHotels(city?: string): Promise<HotelDTO[]> {
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  const response = await fetch(`${API_BASE}/hotels?${params.toString()}`);
  if (!response.ok) return [];
  return response.json();
}

export async function checkBackendHealth(): Promise<{ status: string; database: string }> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) return { status: 'offline', database: 'unknown' };
    return await response.json();
  } catch {
    return { status: 'offline', database: 'disconnected' };
  }
}

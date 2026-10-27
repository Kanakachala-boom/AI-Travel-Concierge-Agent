export interface FlightDTO {
  id: number;
  flight_number: string;
  airline: string;
  origin_city: string;
  origin_code: string;
  destination_city: string;
  destination_code: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  layover_duration_minutes: number;
  price_per_adult: number;
  available_seats: number;
}

export interface HotelDTO {
  id: number;
  name: string;
  city: string;
  star_rating: number;
  price_per_night: number;
  amenities: string[];
  available_rooms: number;
  max_occupancy_per_room: number;
  description?: string;
  image_url?: string;
}

export interface TravelPackage {
  outbound_flight: FlightDTO;
  return_flight: FlightDTO;
  hotel: HotelDTO;
  nights: number;
  rooms_required: number;
  flight_cost: number;
  hotel_cost: number;
  total_cost: number;
  remaining_budget: number;
  convenience_score: number;
  soft_penalties: string[];
  is_relaxed_hotel_category: boolean;
}

export interface RejectionSummary {
  total_combinations_evaluated: number;
  route_incompatible: number;
  date_incompatible: number;
  insufficient_flight_seats: number;
  insufficient_hotel_rooms: number;
  hotel_stars_mismatch: number;
  stops_exceeded: number;
  budget_exceeded: number;
  layover_exceeded: number;
  amenities_missing: number;
}

export interface RecommendationResponse {
  id?: string;
  status: 'SUCCESS' | 'NO_FEASIBLE_PACKAGE' | 'INVALID_INPUT' | 'ERROR';
  message: string;
  best_package?: TravelPackage | null;
  alternative_packages: TravelPackage[];
  explanation: string;
  actionable_suggestions: string[];
  rejection_summary: RejectionSummary;
}

export interface RecommendationRequest {
  departure_city: string;
  destination_city: string;
  departure_date: string;
  return_date: string;
  adults: number;
  budget: number;
  preferred_hotel_stars?: number | null;
  hotel_category_is_hard: boolean;
  preferred_airline?: string | null;
  max_flight_stops?: number | null;
  max_flight_stops_is_hard: boolean;
  max_layover_minutes?: number | null;
  preferred_amenities: string[];
  amenities_are_hard: boolean;
  room_sharing: boolean;
  rooms_per_party?: number | null;
}

export interface RecommendationHistoryItem {
  id: string;
  created_at: string;
  departure_city: string;
  destination_city: string;
  departure_date: string;
  return_date: string;
  adults: number;
  budget: number;
  status: string;
}

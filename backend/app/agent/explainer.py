from typing import List
from app.agent.types import TravelPackage, TravelRequirements, RejectionSummary

def generate_recommendation_explanation(
    best_pkg: TravelPackage,
    req: TravelRequirements,
    alternative_count: int,
    rejections: RejectionSummary
) -> str:
    """
    Produces a comprehensive, professional explanation detailing why the best package
    was chosen, how all hard constraints were satisfied, cost breakdown, and tie-breakers.
    """
    out_flight = best_pkg.outbound_flight
    ret_flight = best_pkg.return_flight
    hotel = best_pkg.hotel

    lines = [
        f"Selected as the optimal travel package with the lowest total cost of ₹{best_pkg.total_cost:,.2f}, "
        f"leaving ₹{best_pkg.remaining_budget:,.2f} under your budget of ₹{req.budget:,.2f}."
    ]

    # Constraints satisfied
    lines.append(
        f"• Hard Constraints: Non-stop/feasible round-trip between {req.departure_city} and {req.destination_city} "
        f"for {req.adults} adult{'s' if req.adults > 1 else ''} ({best_pkg.rooms_required} room{'s' if best_pkg.rooms_required > 1 else ''}, {best_pkg.nights} night{'s' if best_pkg.nights > 1 else ''})."
    )

    # Hotel tier note
    if best_pkg.is_relaxed_hotel_category:
        lines.append(
            f"• Note: Hotel category relaxed to {hotel.star_rating}★ ({hotel.name}) because no strictly matching "
            f"{req.preferred_hotel_stars}★ hotel was available within budget."
        )
    else:
        stars_note = f"{hotel.star_rating}★" if req.preferred_hotel_stars else f"{hotel.star_rating}★ rating"
        lines.append(f"• Hotel: {hotel.name} perfectly satisfies your {stars_note} requirement at ₹{hotel.price_per_night:,.2f}/night.")

    # Flight details
    stops_text = "direct non-stop" if (out_flight.stops + ret_flight.stops == 0) else f"{out_flight.stops + ret_flight.stops} total stops"
    lines.append(
        f"• Flights: Outbound on {out_flight.airline} ({out_flight.flight_number}) and return on {ret_flight.airline} ({ret_flight.flight_number}), {stops_text}."
    )

    # Soft constraints & perks
    if best_pkg.soft_penalties:
        penalties_str = "; ".join(best_pkg.soft_penalties)
        lines.append(f"• Note on soft preferences: {penalties_str} (retained to ensure absolute lowest price).")
    else:
        lines.append("• Preferences: Matches all your airline, stops, and amenity preferences.")

    # Alternatives and pruning note
    if alternative_count > 0:
        lines.append(
            f"• Compared across {rejections.total_combinations_evaluated} combinations; "
            f"{alternative_count} valid alternative package{'s' if alternative_count > 1 else ''} ranked below."
        )

    return "\n".join(lines)


def generate_infeasible_explanation(
    req: TravelRequirements,
    rejections: RejectionSummary
) -> tuple[str, List[str]]:
    """
    Explains why no feasible package could be found and gives specific, actionable suggestions.
    """
    explanation_parts = [
        f"No valid travel package could be found satisfying all your hard constraints for travel between "
        f"{req.departure_city} and {req.destination_city} from {req.departure_date} to {req.return_date}."
    ]

    suggestions: List[str] = []

    # Diagnose reasons based on rejection metrics
    if rejections.budget_exceeded > 0:
        explanation_parts.append(
            f"The primary bottleneck was budget constraint (exceeded in {rejections.budget_exceeded} candidate combinations)."
        )
        suggestions.append(
            f"Consider increasing your budget above ₹{req.budget:,.2f} to cover minimum round-trip flight fares and nightly hotel rates."
        )

    if rejections.hotel_stars_mismatch > 0 and req.preferred_hotel_stars:
        explanation_parts.append(
            f"No hotels matching your strict {req.preferred_hotel_stars}★ requirement could be paired with flights within your budget."
        )
        suggestions.append(
            f"Enable 'Flexible Hotel Category' or select a 3★ or 4★ hotel tier to view lower-cost accommodations."
        )

    if rejections.insufficient_flight_seats > 0 or rejections.insufficient_hotel_rooms > 0:
        explanation_parts.append(
            f"Capacity limits were reached for {req.adults} traveler(s)."
        )
        suggestions.append("Check adjacent travel dates with higher seat and room availability.")

    if rejections.route_incompatible > 0 or rejections.date_incompatible > 0 or rejections.total_combinations_evaluated == 0:
        explanation_parts.append(
            f"Direct or connecting simulated flights were not found for the requested route and date pair."
        )
        suggestions.append(
            "Try popular simulated corridors such as Delhi (DEL) to Mumbai (BOM), Delhi to Goa (GOI), or Mumbai to Bengaluru (BLR) in November 2026."
        )

    if not suggestions:
        suggestions.append("Try relaxing optional constraints such as airline preference, max stops, or specific amenities.")
        suggestions.append("Adjust departure or return dates.")

    return "\n".join(explanation_parts), suggestions

import json
import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.flight import Flight
from app.models.hotel import Hotel
from app.models.recommendation import RecommendationHistory
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendationHistoryItem,
)
from app.agent.agent import ConciergeAgent
from app.agent.types import TravelRequirements, FlightDTO, HotelDTO

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

def flight_to_dto(f: Flight) -> FlightDTO:
    return FlightDTO(
        id=f.id,
        flight_number=f.flight_number,
        airline=f.airline,
        origin_city=f.origin_city,
        origin_code=f.origin_code,
        destination_city=f.destination_city,
        destination_code=f.destination_code,
        departure_time=f.departure_time,
        arrival_time=f.arrival_time,
        duration_minutes=f.duration_minutes,
        stops=f.stops,
        layover_duration_minutes=f.layover_duration_minutes,
        price_per_adult=f.price_per_adult,
        available_seats=f.available_seats,
    )

def hotel_to_dto(h: Hotel) -> HotelDTO:
    return HotelDTO(
        id=h.id,
        name=h.name,
        city=h.city,
        star_rating=h.star_rating,
        price_per_night=h.price_per_night,
        amenities=h.amenities if isinstance(h.amenities, list) else [],
        available_rooms=h.available_rooms,
        max_occupancy_per_room=h.max_occupancy_per_room,
        description=h.description,
        image_url=h.image_url,
    )

@router.post("", response_model=RecommendationResponse, status_code=status.HTTP_200_OK)
def create_recommendation(
    payload: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Validates travel requirements, coordinates database queries for simulated inventory,
    executes the goal-based agent optimization, persists search history, and returns ranked packages.
    """
    # 1. Map to agent's TravelRequirements domain model
    req = TravelRequirements(
        departure_city=payload.departure_city,
        destination_city=payload.destination_city,
        departure_date=payload.departure_date,
        return_date=payload.return_date,
        adults=payload.adults,
        budget=payload.budget,
        preferred_hotel_stars=payload.preferred_hotel_stars,
        hotel_category_is_hard=payload.hotel_category_is_hard,
        preferred_airline=payload.preferred_airline,
        max_flight_stops=payload.max_flight_stops,
        max_flight_stops_is_hard=payload.max_flight_stops_is_hard,
        max_layover_minutes=payload.max_layover_minutes,
        preferred_amenities=payload.preferred_amenities,
        amenities_are_hard=payload.amenities_are_hard,
        room_sharing=payload.room_sharing,
        rooms_per_party=payload.rooms_per_party,
    )

    # 2. Query simulated flight & hotel inventory from DB
    dep_city = payload.departure_city.strip().lower()
    dest_city = payload.destination_city.strip().lower()

    # Outbound flights: dep -> dest on departure_date
    outbounds = db.query(Flight).filter(
        func.lower(Flight.origin_city) == dep_city,
        func.lower(Flight.destination_city) == dest_city,
    ).all()

    # Return flights: dest -> dep on return_date
    returns = db.query(Flight).filter(
        func.lower(Flight.origin_city) == dest_city,
        func.lower(Flight.destination_city) == dep_city,
    ).all()

    # Destination hotels
    hotels = db.query(Hotel).filter(
        func.lower(Hotel.city) == dest_city
    ).all()

    # Convert to DTOs
    all_flights = [flight_to_dto(f) for f in (outbounds + returns)]
    all_hotels = [hotel_to_dto(h) for h in hotels]

    # 3. Execute the Goal-Based Intelligent Agent
    agent = ConciergeAgent()
    agent_result = agent.run(req, all_flights, all_hotels)

    # 4. Generate persistent ID & save search history to DB
    search_id = str(uuid.uuid4())
    response_data = RecommendationResponse(
        id=search_id,
        status=agent_result.status,
        message=agent_result.message,
        best_package=agent_result.best_package,
        alternative_packages=agent_result.alternative_packages,
        explanation=agent_result.explanation,
        actionable_suggestions=agent_result.actionable_suggestions,
        rejection_summary=agent_result.rejection_summary,
    )

    try:
        history_record = RecommendationHistory(
            id=search_id,
            departure_city=payload.departure_city,
            destination_city=payload.destination_city,
            departure_date=payload.departure_date,
            return_date=payload.return_date,
            adults=payload.adults,
            budget=payload.budget,
            preferred_hotel_stars=payload.preferred_hotel_stars,
            request_payload=json.loads(payload.model_dump_json()),
            response_payload=json.loads(response_data.model_dump_json()),
            status=agent_result.status,
        )
        db.add(history_record)
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-fatal log so recommendation response still succeeds if history write errors
        print(f"Warning: Failed to save search history: {e}")

    return response_data


@router.get("/history", response_model=List[RecommendationHistoryItem])
def get_recommendation_history(limit: int = 10, db: Session = Depends(get_db)):
    """Retrieves recent recommendation search history records."""
    records = db.query(RecommendationHistory).order_by(
        RecommendationHistory.created_at.desc()
    ).limit(limit).all()
    return records


@router.get("/{search_id}", response_model=RecommendationResponse)
def get_recommendation_by_id(search_id: str, db: Session = Depends(get_db)):
    """Retrieves a previously computed recommendation by its unique search ID."""
    record = db.query(RecommendationHistory).filter(RecommendationHistory.id == search_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation with ID '{search_id}' not found."
        )
    
    return RecommendationResponse(**record.response_payload)

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class RecommendationHistory(Base):
    __tablename__ = "recommendation_histories"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    departure_city = Column(String(100), nullable=False)
    destination_city = Column(String(100), nullable=False)
    departure_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=False)
    adults = Column(Integer, nullable=False)
    budget = Column(Float, nullable=False)
    preferred_hotel_stars = Column(Integer, nullable=True)
    
    request_payload = Column(JSON, nullable=False)
    response_payload = Column(JSON, nullable=False)
    status = Column(String(30), nullable=False, default="SUCCESS")  # SUCCESS, NO_FEASIBLE_PACKAGE, ERROR

    user = relationship("User", back_populates="recommendations")

    def __repr__(self):
        return f"<RecommendationHistory {self.id} {self.departure_city}->{self.destination_city} status={self.status}>"

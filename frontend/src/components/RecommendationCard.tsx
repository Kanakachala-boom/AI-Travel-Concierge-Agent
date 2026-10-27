import React from 'react';
import { Award, BrainCircuit } from 'lucide-react';
import type { TravelPackage } from '../types';
import { FlightCard } from './FlightCard';
import { HotelCard } from './HotelCard';
import { CostBreakdown } from './CostBreakdown';

interface RecommendationCardProps {
  packageData: TravelPackage;
  explanation: string;
  adults: number;
  budget: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  packageData,
  explanation,
  adults,
  budget,
}) => {
  return (
    <div className="glass-panel best-package-card">
      <div className="best-badge-ribbon">
        <Award size={14} />
        <span>Top Recommended Package · Lowest Cost Guaranteed</span>
      </div>

      <div className="package-headline-row">
        <div>
          <h2 className="package-destination-title">
            {packageData.outbound_flight.origin_city} ⇄ {packageData.outbound_flight.destination_city}
          </h2>
          <div className="package-itinerary-meta">
            {packageData.nights} Nights · {adults} Adult{adults > 1 ? 's' : ''} · {packageData.rooms_required} Room{packageData.rooms_required > 1 ? 's' : ''} · {packageData.hotel.star_rating}★ Hotel
          </div>
        </div>

        <div className="package-price-box">
          <div className="price-main-tag">
            ₹{packageData.total_cost.toLocaleString('en-IN')}
          </div>
          <div className="price-savings-chip">
            ₹{packageData.remaining_budget.toLocaleString('en-IN')} under budget
          </div>
        </div>
      </div>

      {/* Flight Cards */}
      <div className="flight-cards-container">
        <FlightCard flight={packageData.outbound_flight} type="outbound" />
        <FlightCard flight={packageData.return_flight} type="return" />
      </div>

      {/* Hotel Card */}
      <HotelCard
        hotel={packageData.hotel}
        roomsRequired={packageData.rooms_required}
        nights={packageData.nights}
      />

      {/* Cost Breakdown */}
      <CostBreakdown
        packageData={packageData}
        adults={adults}
        budget={budget}
      />

      {/* Agent Reasoning & Explanation */}
      <div className="agent-explanation-box">
        <div className="agent-box-title">
          <BrainCircuit size={16} />
          <span>Goal-Based Agent Decision Explanation</span>
        </div>
        <div className="agent-explanation-text">
          {explanation}
        </div>
      </div>
    </div>
  );
};

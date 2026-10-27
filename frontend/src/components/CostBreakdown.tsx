import React from 'react';
import { Calculator } from 'lucide-react';
import type { TravelPackage } from '../types';

interface CostBreakdownProps {
  packageData: TravelPackage;
  adults: number;
  budget: number;
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ packageData, adults, budget }) => {
  const outFare = packageData.outbound_flight.price_per_adult;
  const retFare = packageData.return_flight.price_per_adult;

  return (
    <div className="breakdown-section">
      <div className="breakdown-title">
        <Calculator size={16} color="#6366f1" />
        <span>Transparent Cost Calculation Breakdown</span>
      </div>

      <div className="breakdown-row">
        <span>Flight Fare (Outbound ₹{outFare.toLocaleString('en-IN')} + Return ₹{retFare.toLocaleString('en-IN')}) × {adults} adult(s)</span>
        <span>₹{packageData.flight_cost.toLocaleString('en-IN')}</span>
      </div>

      <div className="breakdown-row">
        <span>Hotel Fare (₹{packageData.hotel.price_per_night.toLocaleString('en-IN')} × {packageData.nights} nights × {packageData.rooms_required} room(s))</span>
        <span>₹{packageData.hotel_cost.toLocaleString('en-IN')}</span>
      </div>

      <div className="breakdown-row total-row">
        <span style={{ color: '#fff' }}>Total Estimated Package Cost</span>
        <span style={{ color: '#38bdf8', fontSize: '1.2rem' }}>₹{packageData.total_cost.toLocaleString('en-IN')}</span>
      </div>

      <div className="breakdown-row" style={{ borderBottom: 'none', color: '#34d399', fontWeight: 600 }}>
        <span>User Budget: ₹{budget.toLocaleString('en-IN')}</span>
        <span>Remaining Savings: ₹{packageData.remaining_budget.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

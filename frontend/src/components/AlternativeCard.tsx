import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plane } from 'lucide-react';
import type { TravelPackage } from '../types';
import { FlightCard } from './FlightCard';
import { HotelCard } from './HotelCard';
import { CostBreakdown } from './CostBreakdown';

interface AlternativeCardProps {
  packageData: TravelPackage;
  index: number;
  bestCost: number;
  adults: number;
  budget: number;
}

export const AlternativeCard: React.FC<AlternativeCardProps> = ({
  packageData,
  index,
  bestCost,
  adults,
  budget,
}) => {
  const [expanded, setExpanded] = useState(false);
  const costDiff = packageData.total_cost - bestCost;

  return (
    <div className="glass-panel alternative-card" style={{ marginBottom: '1rem' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: '#a5b4fc',
          }}>
            #{index + 2}
          </span>

          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
              {packageData.hotel.name} · {packageData.hotel.star_rating}★
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
              <span><Plane size={12} style={{ display: 'inline', marginRight: '3px' }} />{packageData.outbound_flight.airline} / {packageData.return_flight.airline}</span>
              <span>·</span>
              <span>{packageData.outbound_flight.stops === 0 && packageData.return_flight.stops === 0 ? 'Direct Flights' : 'Connecting'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
              ₹{packageData.total_cost.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
              +₹{costDiff.toLocaleString('en-IN')} vs best
            </div>
          </div>

          <button style={{
            background: 'none',
            border: 'none',
            color: '#a5b4fc',
            cursor: 'pointer',
            padding: '4px',
          }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="flight-cards-container" style={{ marginBottom: '1rem' }}>
            <FlightCard flight={packageData.outbound_flight} type="outbound" />
            <FlightCard flight={packageData.return_flight} type="return" />
          </div>

          <HotelCard
            hotel={packageData.hotel}
            roomsRequired={packageData.rooms_required}
            nights={packageData.nights}
          />

          <CostBreakdown
            packageData={packageData}
            adults={adults}
            budget={budget}
          />
        </div>
      )}
    </div>
  );
};

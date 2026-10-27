import React from 'react';
import { PlaneTakeoff, PlaneLanding, Clock } from 'lucide-react';
import type { FlightDTO } from '../types';

interface FlightCardProps {
  flight: FlightDTO;
  type: 'outbound' | 'return';
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, type }) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const hours = Math.floor(flight.duration_minutes / 60);
  const minutes = flight.duration_minutes % 60;
  const durationFormatted = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;

  return (
    <div className="flight-leg-card">
      <div className="leg-header">
        <div className="leg-tag">
          {type === 'outbound' ? <PlaneTakeoff size={14} /> : <PlaneLanding size={14} />}
          <span>{type === 'outbound' ? 'Outbound Journey' : 'Return Journey'}</span>
        </div>
        <div className="airline-badge">
          {flight.airline} · <span style={{ color: '#94a3b8' }}>{flight.flight_number}</span>
        </div>
      </div>

      <div className="flight-timeline-row">
        <div className="timeline-station">
          <div className="station-time">{formatTime(flight.departure_time)}</div>
          <div className="station-code">{flight.origin_code} · {flight.origin_city}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatDate(flight.departure_time)}</div>
        </div>

        <div className="timeline-middle">
          <div className="duration-text">
            <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
            {durationFormatted}
          </div>
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            margin: '0.35rem 0',
            position: 'relative',
            borderRadius: '2px'
          }} />
          <span className={`stops-pill ${flight.stops === 0 ? 'nonstop' : 'connecting'}`}>
            {flight.stops === 0 ? 'Direct Non-stop' : `${flight.stops} Stop (${flight.layover_duration_minutes}m layover)`}
          </span>
        </div>

        <div className="timeline-station right">
          <div className="station-time">{formatTime(flight.arrival_time)}</div>
          <div className="station-code">{flight.destination_code} · {flight.destination_city}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatDate(flight.arrival_time)}</div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        color: '#94a3b8',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '0.5rem',
        marginTop: '0.5rem'
      }}>
        <span>Fare: ₹{flight.price_per_adult.toLocaleString('en-IN')} / adult</span>
        <span style={{ color: flight.available_seats <= 5 ? '#f43f5e' : '#10b981' }}>
          {flight.available_seats} seats remaining
        </span>
      </div>
    </div>
  );
};

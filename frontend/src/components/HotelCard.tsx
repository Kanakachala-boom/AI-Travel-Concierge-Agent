import React from 'react';
import { Star, MapPin, Users, Building2 } from 'lucide-react';
import type { HotelDTO } from '../types';

interface HotelCardProps {
  hotel: HotelDTO;
  roomsRequired: number;
  nights: number;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, roomsRequired, nights }) => {
  return (
    <div className="hotel-card-view">
      <div className="hotel-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Building2 size={13} />
            <span>Recommended Hotel</span>
          </div>
          <div className="hotel-name-view">{hotel.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            <MapPin size={12} />
            <span>{hotel.city}</span>
            <span>·</span>
            <div className="hotel-stars">
              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                <Star key={i} size={13} fill="#fbbf24" strokeWidth={0} />
              ))}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24', marginLeft: '2px' }}>
                {hotel.star_rating}★
              </span>
            </div>
          </div>
        </div>

        <div className="hotel-nightly-rate">
          <div className="hotel-rate-number">₹{hotel.price_per_night.toLocaleString('en-IN')}</div>
          <div className="hotel-rate-label">per room / night</div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        fontSize: '0.82rem',
        color: '#cbd5e1',
        margin: '0.75rem 0',
        padding: '0.5rem 0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={14} color="#a5b4fc" />
          <span>Config: <strong>{roomsRequired} room(s)</strong> for <strong>{nights} night(s)</strong></span>
        </div>
        <div style={{ color: '#64748b' }}>|</div>
        <div>Max occupancy: {hotel.max_occupancy_per_room} adults/room</div>
      </div>

      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="hotel-amenities-tags">
          {hotel.amenities.map((amenity, idx) => (
            <span key={idx} className="amenity-chip">
              ✓ {amenity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

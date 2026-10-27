import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Star,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import type { RecommendationRequest } from '../types';

interface SearchFormProps {
  initialValues?: Partial<RecommendationRequest>;
  onSubmit: (values: RecommendationRequest) => void;
  isLoading: boolean;
}

const CITIES = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Goa',
  'Kolkata',
  'Chennai',
  'Jaipur',
  'Hyderabad',
];

const AIRLINES = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Akasa Air'];

const AMENITY_OPTIONS = [
  'Free WiFi',
  'Breakfast Included',
  'Swimming Pool',
  'Spa',
  'Airport Shuttle',
  'Fitness Center',
];

const BUDGET_PRESETS = [20000, 35000, 50000, 75000, 150000];

export const SearchForm: React.FC<SearchFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
}) => {
  const [departureCity, setDepartureCity] = useState(initialValues?.departure_city || 'Delhi');
  const [destinationCity, setDestinationCity] = useState(initialValues?.destination_city || 'Mumbai');
  const [departureDate, setDepartureDate] = useState(initialValues?.departure_date || '2026-11-10');
  const [returnDate, setReturnDate] = useState(initialValues?.return_date || '2026-11-14');
  const [adults, setAdults] = useState(initialValues?.adults || 2);
  const [budget, setBudget] = useState(initialValues?.budget || 50000);
  const [hotelStars, setHotelStars] = useState<number | null>(initialValues?.preferred_hotel_stars ?? 4);
  const [hotelCategoryHard, setHotelCategoryHard] = useState(initialValues?.hotel_category_is_hard ?? true);

  // Advanced toggles
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preferredAirline, setPreferredAirline] = useState<string>(initialValues?.preferred_airline || '');
  const [maxStops, setMaxStops] = useState<number | null>(initialValues?.max_flight_stops ?? null);
  const [maxStopsHard, setMaxStopsHard] = useState(initialValues?.max_flight_stops_is_hard ?? false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialValues?.preferred_amenities || []);
  const [amenitiesHard, setAmenitiesHard] = useState(initialValues?.amenities_are_hard ?? false);
  const [roomSharing, setRoomSharing] = useState(initialValues?.room_sharing ?? true);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (departureCity.trim().toLowerCase() === destinationCity.trim().toLowerCase()) {
      setValidationError('Departure and destination cities cannot be the same.');
      return;
    }

    if (new Date(returnDate) < new Date(departureDate)) {
      setValidationError('Return date cannot precede departure date.');
      return;
    }

    if (adults < 1) {
      setValidationError('Traveler count must be at least 1 adult.');
      return;
    }

    if (budget <= 0) {
      setValidationError('Please enter a valid budget in INR.');
      return;
    }

    const payload: RecommendationRequest = {
      departure_city: departureCity,
      destination_city: destinationCity,
      departure_date: departureDate,
      return_date: returnDate,
      adults,
      budget,
      preferred_hotel_stars: hotelStars,
      hotel_category_is_hard: hotelCategoryHard,
      preferred_airline: preferredAirline || null,
      max_flight_stops: maxStops,
      max_flight_stops_is_hard: maxStopsHard,
      preferred_amenities: selectedAmenities,
      amenities_are_hard: amenitiesHard,
      room_sharing: roomSharing,
    };

    onSubmit(payload);
  };

  return (
    <div className="glass-panel search-form-card">
      <div className="form-header-title">
        <SlidersHorizontal size={20} color="#6366f1" />
        <span>Travel Requirements</span>
      </div>
      <div className="form-header-subtitle">
        Intelligent goal-based constraint optimization
      </div>

      {validationError && (
        <div style={{
          padding: '0.65rem 0.85rem',
          borderRadius: '8px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          color: '#fb7185',
          fontSize: '0.82rem',
          marginBottom: '1rem'
        }}>
          {validationError}
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        {/* Route: Origin & Destination */}
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Departure City</label>
            <div className="input-with-icon">
              <MapPin size={16} className="input-icon" />
              <select
                className="form-select"
                value={departureCity}
                onChange={e => setDepartureCity(e.target.value)}
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Destination</label>
            <div className="input-with-icon">
              <MapPin size={16} className="input-icon" />
              <select
                className="form-select"
                value={destinationCity}
                onChange={e => setDestinationCity(e.target.value)}
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Departure Date</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input
                type="date"
                className="form-input"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Return Date</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input
                type="date"
                className="form-input"
                value={returnDate}
                min={departureDate}
                onChange={e => setReturnDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Adults & Budget */}
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Adults</label>
            <div className="input-with-icon">
              <Users size={16} className="input-icon" />
              <input
                type="number"
                min={1}
                max={10}
                className="form-input"
                value={adults}
                onChange={e => setAdults(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total Budget (₹)</label>
            <div className="input-with-icon">
              <IndianRupee size={16} className="input-icon" />
              <input
                type="number"
                step="500"
                className="form-input"
                value={budget}
                onChange={e => setBudget(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>
        </div>

        {/* Quick Budget Presets */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '0.35rem' }}>QUICK PRESETS:</div>
          <div className="budget-presets">
            {BUDGET_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                className={`budget-chip ${budget === preset ? 'active' : ''}`}
                onClick={() => setBudget(preset)}
              >
                ₹{(preset / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Hotel Star Rating */}
        <div className="form-group">
          <label className="form-label">Preferred Hotel Rating</label>
          <div className="star-rating-buttons">
            <button
              type="button"
              className={`star-btn ${hotelStars === null ? 'active' : ''}`}
              onClick={() => setHotelStars(null)}
            >
              Any
            </button>
            {[3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-btn ${hotelStars === star ? 'active' : ''}`}
                onClick={() => setHotelStars(star)}
              >
                <Star size={13} fill={hotelStars === star ? '#fbbf24' : 'none'} />
                <span>{star}★</span>
              </button>
            ))}
          </div>

          {hotelStars !== null && (
            <div style={{ marginTop: '0.5rem' }}>
              <label className="checkbox-toggle-row">
                <input
                  type="checkbox"
                  checked={!hotelCategoryHard}
                  onChange={e => setHotelCategoryHard(!e.target.checked)}
                />
                <span>Allow Flexible Category (relax to adjacent star ratings if needed)</span>
              </label>
            </div>
          )}
        </div>

        {/* Collapsible Advanced Preferences */}
        <button
          type="button"
          className="collapsible-trigger"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>More Preferences (Airlines, Stops, Amenities)</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="form-group">
              <label className="form-label">Preferred Airline</label>
              <select
                className="form-select"
                style={{ paddingLeft: '0.9rem' }}
                value={preferredAirline}
                onChange={e => setPreferredAirline(e.target.value)}
              >
                <option value="">Any Airline</option>
                {AIRLINES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Flight Stops</label>
              <select
                className="form-select"
                style={{ paddingLeft: '0.9rem' }}
                value={maxStops === null ? '' : maxStops}
                onChange={e => setMaxStops(e.target.value === '' ? null : parseInt(e.target.value))}
              >
                <option value="">Any Stops</option>
                <option value="0">Direct Non-Stop Only</option>
                <option value="1">Max 1 Stop</option>
              </select>

              {maxStops !== null && (
                <label className="checkbox-toggle-row" style={{ marginTop: '0.45rem' }}>
                  <input
                    type="checkbox"
                    checked={maxStopsHard}
                    onChange={e => setMaxStopsHard(e.target.checked)}
                  />
                  <span>Enforce stops as strict hard constraint</span>
                </label>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Hotel Amenities</label>
              <div className="amenities-grid">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="amenity-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>

              {selectedAmenities.length > 0 && (
                <label className="checkbox-toggle-row" style={{ marginTop: '0.6rem' }}>
                  <input
                    type="checkbox"
                    checked={amenitiesHard}
                    onChange={e => setAmenitiesHard(e.target.checked)}
                  />
                  <span>Mandatory amenities (reject hotels lacking them)</span>
                </label>
              )}
            </div>

            <label className="checkbox-toggle-row">
              <input
                type="checkbox"
                checked={roomSharing}
                onChange={e => setRoomSharing(e.target.checked)}
              />
              <span>Room Sharing (group guests up to 2-3 per room to save cost)</span>
            </label>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              <span>Optimizing Package...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Find Best Travel Package</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

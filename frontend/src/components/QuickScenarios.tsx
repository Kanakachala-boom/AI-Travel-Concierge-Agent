import React from 'react';
import { PlayCircle } from 'lucide-react';
import type { RecommendationRequest } from '../types';

interface QuickScenariosProps {
  onSelectScenario: (scenario: RecommendationRequest) => void;
}

export const QuickScenarios: React.FC<QuickScenariosProps> = ({ onSelectScenario }) => {
  const scenarios: { label: string; desc: string; payload: RecommendationRequest }[] = [
    {
      label: '1. Tight-Budget Trip (₹20k)',
      desc: 'Delhi → Mumbai, 1 adult, ₹20,000 budget, 3★ hotel',
      payload: {
        departure_city: 'Delhi',
        destination_city: 'Mumbai',
        departure_date: '2026-11-10',
        return_date: '2026-11-14',
        adults: 1,
        budget: 20000,
        preferred_hotel_stars: 3,
        hotel_category_is_hard: true,
        preferred_amenities: [],
        amenities_are_hard: false,
        max_flight_stops_is_hard: false,
        room_sharing: true,
      },
    },
    {
      label: '2. Luxury Palace Trip (₹1.5L)',
      desc: 'Delhi → Mumbai, 2 adults, ₹1,50,000 budget, strict 5★ hotel',
      payload: {
        departure_city: 'Delhi',
        destination_city: 'Mumbai',
        departure_date: '2026-11-10',
        return_date: '2026-11-14',
        adults: 2,
        budget: 150000,
        preferred_hotel_stars: 5,
        hotel_category_is_hard: true,
        preferred_amenities: ['Swimming Pool', 'Spa'],
        amenities_are_hard: false,
        max_flight_stops_is_hard: false,
        room_sharing: true,
      },
    },
    {
      label: '3. Infeasible Budget (₹4k)',
      desc: 'Delhi → Goa, 2 adults, ₹4,000 budget (triggers AI diagnostic suggestions)',
      payload: {
        departure_city: 'Delhi',
        destination_city: 'Goa',
        departure_date: '2026-11-12',
        return_date: '2026-11-16',
        adults: 2,
        budget: 4000,
        preferred_hotel_stars: 4,
        hotel_category_is_hard: true,
        preferred_amenities: [],
        amenities_are_hard: false,
        max_flight_stops_is_hard: false,
        room_sharing: true,
      },
    },
  ];

  return (
    <div className="scenarios-quick-bar">
      <div className="scenario-label">
        <PlayCircle size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
        <span>Try Test Scenarios:</span>
      </div>
      <div className="scenario-buttons">
        {scenarios.map((sc, i) => (
          <button
            key={i}
            type="button"
            className="scenario-btn"
            title={sc.desc}
            onClick={() => onSelectScenario(sc.payload)}
          >
            {sc.label}
          </button>
        ))}
      </div>
    </div>
  );
};

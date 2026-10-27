import React from 'react';
import { AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import type { RejectionSummary } from '../types';

interface ErrorStateProps {
  status: string;
  explanation: string;
  actionableSuggestions: string[];
  rejectionSummary?: RejectionSummary;
  onReset: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  status,
  explanation,
  actionableSuggestions,
  rejectionSummary,
  onReset,
}) => {
  return (
    <div className="glass-panel infeasible-state-card">
      <div className="infeasible-icon-circle">
        <AlertCircle size={32} />
      </div>

      <h3 className="infeasible-title">
        {status === 'INVALID_INPUT' ? 'Invalid Travel Requirements' : 'No Feasible Package Found'}
      </h3>

      <div className="infeasible-explanation-text">
        {explanation}
      </div>

      {rejectionSummary && rejectionSummary.total_combinations_evaluated > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
            Evaluated {rejectionSummary.total_combinations_evaluated} Combinations
          </span>
          {rejectionSummary.budget_exceeded > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
              Budget Exceeded: {rejectionSummary.budget_exceeded}
            </span>
          )}
          {rejectionSummary.hotel_stars_mismatch > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              Star Mismatch: {rejectionSummary.hotel_stars_mismatch}
            </span>
          )}
          {rejectionSummary.insufficient_flight_seats > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              Seats Unavailable: {rejectionSummary.insufficient_flight_seats}
            </span>
          )}
        </div>
      )}

      {actionableSuggestions && actionableSuggestions.length > 0 && (
        <div className="suggestions-box">
          <div className="suggestions-title">
            <HelpCircle size={15} />
            <span>Agent Suggestions & Next Steps</span>
          </div>
          <ul className="suggestions-list">
            {actionableSuggestions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onReset}
        style={{
          marginTop: '1.5rem',
          padding: '0.65rem 1.25rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          fontSize: '0.86rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
        }}
      >
        <RefreshCw size={14} />
        <span>Adjust Search Requirements</span>
      </button>
    </div>
  );
};

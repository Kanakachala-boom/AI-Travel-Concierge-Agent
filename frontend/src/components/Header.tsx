import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

interface HeaderProps {
  backendOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendOnline }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <Compass size={24} />
          </div>
          <div>
            <div className="brand-title">E-Commerce Concierge Agent</div>
            <div className="brand-subtitle">Goal-Based AI Travel Optimization Engine</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="header-status-badge">
            <span className="pulse-dot" style={{ backgroundColor: backendOnline ? '#10b981' : '#f43f5e' }} />
            <span>{backendOnline ? 'AI Agent Engine: Online' : 'Backend Connecting...'}</span>
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Sparkles size={12} color="#06b6d4" />
            <span>Simulated Indian Inventory</span>
          </div>
        </div>
      </div>
    </header>
  );
};

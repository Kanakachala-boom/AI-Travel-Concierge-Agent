import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { QuickScenarios } from './components/QuickScenarios';
import { RecommendationCard } from './components/RecommendationCard';
import { AlternativeCard } from './components/AlternativeCard';
import { ErrorState } from './components/ErrorState';
import type { RecommendationRequest, RecommendationResponse } from './types';
import { fetchRecommendations, checkBackendHealth } from './services/api';
import { Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<RecommendationRequest>({
    departure_city: 'Delhi',
    destination_city: 'Mumbai',
    departure_date: '2026-11-10',
    return_date: '2026-11-14',
    adults: 2,
    budget: 50000,
    preferred_hotel_stars: 4,
    hotel_category_is_hard: true,
    preferred_amenities: [],
    amenities_are_hard: false,
    max_flight_stops_is_hard: false,
    room_sharing: true,
  });

  const [recommendationResult, setRecommendationResult] = useState<RecommendationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check health and run initial search on mount
  useEffect(() => {
    const init = async () => {
      const health = await checkBackendHealth();
      setBackendOnline(health.status === 'online');
      // Run initial search
      handleSearch(currentRequest);
    };
    init();
  }, []);

  const handleSearch = async (req: RecommendationRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentRequest(req);

    try {
      const res = await fetchRecommendations(req);
      setRecommendationResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reach travel recommendation service.');
      setRecommendationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setErrorMessage(null);
  };

  return (
    <div className="app-container">
      <Header backendOnline={backendOnline} />

      <main className="app-main-content">
        {/* Left Column: Input Search Form */}
        <div className="left-panel">
          <SearchForm
            key={`${currentRequest.departure_city}-${currentRequest.destination_city}-${currentRequest.budget}-${currentRequest.preferred_hotel_stars}`}
            initialValues={currentRequest}
            onSubmit={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Scenarios & Results */}
        <div className="right-panel">
          <QuickScenarios onSelectScenario={handleSearch} />

          {isLoading && (
            <div className="glass-panel loading-box">
              <div className="spinner" />
              <div className="loading-text">Agent Optimization in Progress...</div>
              <div className="loading-subtext">
                Evaluating candidate flights and hotels · Enforcing hard constraints · Minimizing total cost in INR
              </div>
            </div>
          )}

          {!isLoading && errorMessage && (
            <ErrorState
              status="ERROR"
              explanation={errorMessage}
              actionableSuggestions={[
                "Ensure FastAPI backend is running locally on port 8000.",
                "Verify database connection and seeded inventory.",
              ]}
              onReset={handleReset}
            />
          )}

          {!isLoading && recommendationResult && recommendationResult.status !== 'SUCCESS' && (
            <ErrorState
              status={recommendationResult.status}
              explanation={recommendationResult.explanation}
              actionableSuggestions={recommendationResult.actionable_suggestions}
              rejectionSummary={recommendationResult.rejection_summary}
              onReset={handleReset}
            />
          )}

          {!isLoading && recommendationResult && recommendationResult.status === 'SUCCESS' && recommendationResult.best_package && (
            <div className="results-container">
              {/* Primary Best Recommendation */}
              <RecommendationCard
                packageData={recommendationResult.best_package}
                explanation={recommendationResult.explanation}
                adults={currentRequest.adults}
                budget={currentRequest.budget}
              />

              {/* Alternative Packages */}
              {recommendationResult.alternative_packages && recommendationResult.alternative_packages.length > 0 && (
                <div className="alternatives-container">
                  <h3 className="alternatives-heading">
                    <Layers size={18} color="#6366f1" />
                    <span>Ranked Alternative Packages ({recommendationResult.alternative_packages.length})</span>
                  </h3>
                  
                  {recommendationResult.alternative_packages.map((altPkg, idx) => (
                    <AlternativeCard
                      key={idx}
                      packageData={altPkg}
                      index={idx}
                      bestCost={recommendationResult.best_package!.total_cost}
                      adults={currentRequest.adults}
                      budget={currentRequest.budget}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

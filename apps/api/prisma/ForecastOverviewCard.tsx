import React, { useState, useEffect } from 'react';
import BudgetRecommendationCard from './BudgetRecommendationCard';
import ForecastNarrative from './ForecastNarrative';

interface ForecastOverviewCardProps {
  briefId: string;
}

const Metric = ({ label, value }) => (
  <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default function ForecastOverviewCard({ briefId }: ForecastOverviewCardProps) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns/forecast/brief/${briefId}`);
        if (!res.ok) {
          // If not found, trigger generation
          const genRes = await fetch(`/api/campaigns/forecast/${briefId}`, { method: 'POST' });
          if (!genRes.ok) throw new Error('Failed to generate forecast.');
          setForecast(await genRes.json());
        } else {
          setForecast(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [briefId]);

  if (loading) return <div className="p-6">Generating AI Forecast...</div>;
  if (!forecast) return <div className="p-6">Could not load forecast.</div>;

  const formatNumber = (num) => (num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">AI Campaign Forecast</h2>
      <ForecastNarrative summary={forecast.summary} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <Metric label="Predicted Reach" value={formatNumber(forecast.predictedReach)} />
        <Metric label="Predicted Views" value={formatNumber(forecast.predictedViews)} />
        <Metric label="Predicted Engagement" value={formatNumber(forecast.predictedEngagement)} />
        <Metric label="Predicted CTR" value={`${forecast.predictedCTR}%`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetRecommendationCard budgetMin={forecast.budgetMin} budgetMax={forecast.budgetMax} />
        {/* Add other components like CreatorMixTable, PlatformBreakdownChart here */}
      </div>
    </div>
  );
}
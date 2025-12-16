import React, { useState, useEffect } from 'react';

const Stat = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default function PerformanceForecastCard({ deliverableId }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliverableId) return;
    setLoading(true);
    // In a real app, you might poll for results after triggering a generation
    fetch(`/api/forecast/content/${deliverableId}`)
      .then(res => res.json())
      .then(setForecast)
      .finally(() => setLoading(false));
  }, [deliverableId]);

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse"></div>;
  if (!forecast) return null;

  const {
    predictedViews,
    predictedEngagement,
    performanceTier,
    viralityScore,
    suggestions,
  } = forecast;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">AI Performance Forecast</h3>
        <div className="text-right">
          <p className="font-bold text-2xl text-blue-500">{performanceTier}</p>
          <p className="text-xs text-gray-500">Performance Tier</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <Stat label="Predicted Views" value={predictedViews?.toLocaleString()} />
        <Stat label="Predicted Engagement" value={predictedEngagement?.toLocaleString()} />
        <Stat label="Virality Score" value={(viralityScore * 100).toFixed(0)} />
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2">AI Suggestions to Improve Performance:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          {(suggestions || []).map((suggestion, i) => (
            <li key={i}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
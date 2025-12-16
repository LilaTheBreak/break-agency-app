import React, { useState, useEffect } from 'react';

const Stat = ({ label, value, subtext = '' }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
  </div>
);

export default function ForecastWidget({ threadId }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    fetch(`/api/forecast/thread/${threadId}`)
      .then(res => res.json())
      .then(setForecast)
      .finally(() => setLoading(false));
  }, [threadId]);

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse"></div>;
  if (!forecast) return null;

  const {
    likelihood,
    predictedValueExpected,
    predictedTimelineDays,
    recommendedAction,
    aiReasons,
  } = forecast;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">AI Deal Forecast</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Likelihood" value={`${(likelihood * 100).toFixed(0)}%`} />
        <Stat label="Expected Value" value={new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(predictedValueExpected)} />
        <Stat label="Est. Close Time" value={`${predictedTimelineDays} days`} />
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">Recommended Next Action:</h4>
          <p className="p-2 text-sm bg-blue-50 dark:bg-blue-900/50 rounded-md">
            {recommendedAction?.action}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Key Reasons:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {(aiReasons || []).map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
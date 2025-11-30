import React, { useState, useEffect } from 'react';

const Stat = ({ label, value }) => (
  <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default function AICampaignForecastPanel({ dealDraftId }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealDraftId) return;
    setLoading(true);
    // Poll for results
    const interval = setInterval(() => {
      fetch(`/api/forecast/deal/${dealDraftId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setForecast(data);
            setLoading(false);
            clearInterval(interval);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [dealDraftId]);

  const handleRegenerate = async () => {
    setLoading(true);
    await fetch('/api/forecast/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealDraftId }),
    });
  };

  if (loading) return <div className="p-6 text-center">AI is generating the campaign forecast...</div>;
  if (!forecast) return <button onClick={handleRegenerate}>Generate AI Forecast</button>;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">AI Campaign Forecast</h2>
        <button onClick={handleRegenerate} className="text-sm px-3 py-1 border rounded-md">Re-run Forecast</button>
      </header>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">AI Summary</h3>
        <p className="text-sm mt-1">{forecast.summary}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Predicted Views" value={forecast.predictedViews?.toLocaleString()} />
        <Stat label="Predicted Engagement" value={forecast.predictedEngagement?.toLocaleString()} />
        <Stat label="Est. Budget Range" value={`£${forecast.budgetMin} - £${forecast.budgetMax}`} />
        <Stat label="Est. Timeline" value={`${forecast.timelineMinDays} - ${forecast.timelineMaxDays} days`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Potential Risks</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(forecast.risks || []).map((risk, i) => <li key={i}>{risk}</li>)}
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Strategic Recommendations</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(forecast.recommendations || []).map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
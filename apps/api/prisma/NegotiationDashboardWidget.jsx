import React, { useState, useEffect } from 'react';

const StatCard = ({ label, value, subtext }) => (
  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
    {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
  </div>
);

export default function NegotiationDashboardWidget({ threadId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    fetchData();
  }, [threadId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/negotiation/${threadId}/status`)
      .then(res => res.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  };

  const handleGenerateStrategy = async () => {
    setLoading(true);
    await fetch(`/api/negotiation/${threadId}/strategy`, { method: 'POST' });
    setTimeout(fetchData, 5000); // Poll for results
  };

  if (loading) return <div className="p-6 text-center">AI is analyzing...</div>;

  if (!status || !status.strategy) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleGenerateStrategy} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate AI Negotiation Strategy
        </button>
      </div>
    );
  }

  const { strategy, simulation } = status;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Negotiation Strategy</h2>
        <button onClick={handleGenerateStrategy} className="text-sm px-3 py-1 border rounded-md">Regenerate</button>
      </header>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">Strategy: {strategy.strategyName}</h3>
        <p className="text-sm mt-1">Opening Move: {strategy.openingMove.type} at £{strategy.openingMove.value}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Acceptance Likelihood"
          value={`${(simulation.acceptanceLikelihood * 100).toFixed(0)}%`}
        />
        <StatCard label="Predicted Brand Counter" value={`£${simulation.predictedBrandCounter?.toLocaleString() || 'N/A'}`} />
        <StatCard label="AI Confidence" value={`${(simulation.confidence * 100).toFixed(0)}%`} />
      </div>
    </div>
  );
}
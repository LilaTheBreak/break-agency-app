import React, { useState, useEffect } from 'react';

const PathCard = ({ sim, isRecommended }) => (
  <div className={`p-4 rounded-lg border-2 ${isRecommended ? 'border-green-500 bg-green-50 dark:bg-green-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
    <div className="flex justify-between items-center">
      <h4 className="font-bold text-lg">{sim.pathName}</h4>
      {isRecommended && <span className="px-2 py-1 text-xs font-bold text-white bg-green-500 rounded-full">RECOMMENDED</span>}
    </div>
    <div className="text-sm mt-2 grid grid-cols-3 gap-2 text-center">
      <div>
        <p className="font-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(sim.predictedOutcome.finalBudget)}</p>
        <p className="text-xs text-gray-500">Est. Budget</p>
      </div>
      <div>
        <p className="font-bold">{sim.predictedOutcome.daysToClose} days</p>
        <p className="text-xs text-gray-500">Est. Close Time</p>
      </div>
      <div>
        <p className="font-bold capitalize">{sim.predictedOutcome.sentiment}</p>
        <p className="text-xs text-gray-500">Outcome</p>
      </div>
    </div>
    {isRecommended && (
      <div className="mt-4">
        <p className="text-xs font-semibold">Recommended Action:</p>
        <p className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded-md mt-1">{sim.recommendedAction.script}</p>
        <button className="w-full mt-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          AI Draft Email
        </button>
      </div>
    )}
  </div>
);

function useNegotiationSimulations(dealId) {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    fetch(`/api/deals/${dealId}/simulations`)
      .then(res => res.json())
      .then(setSimulations)
      .finally(() => setLoading(false));
  }, [dealId]);

  return { simulations, loading };
}

export default function StrategySimulatorCard({ dealId }) {
  const { simulations, loading } = useNegotiationSimulations(dealId);

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse"></div>;
  if (!simulations || simulations.length === 0) return null;

  const recommendedPath = simulations[0]; // Assuming the API returns them sorted by score

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">AI Negotiation Simulator</h3>
      <div className="space-y-4">
        {simulations.map(sim => (
          <PathCard key={sim.id} sim={sim} isRecommended={sim.id === recommendedPath.id} />
        ))}
      </div>
    </div>
  );
}
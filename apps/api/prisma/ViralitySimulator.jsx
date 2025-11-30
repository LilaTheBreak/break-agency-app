import React, { useState, useEffect } from 'react';

const VariantCard = ({ variant, isTopPick }) => (
  <div className={`p-4 rounded-lg border-2 ${isTopPick ? 'border-green-500 bg-green-50 dark:bg-green-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
    <div className="flex justify-between items-center">
      <p className="text-sm font-semibold">Hook: "{variant.variant.hook}"</p>
      {isTopPick && <span className="text-xs font-bold text-white bg-green-500 px-2 py-1 rounded-full">TOP PICK</span>}
    </div>
    <div className="mt-2 text-center">
      <p className="text-2xl font-bold">{(variant.viralityScore * 100).toFixed(0)}</p>
      <p className="text-xs text-gray-500">Virality Score</p>
    </div>
    <p className="text-xs text-center text-gray-500 mt-1">Est. Views: {variant.predictedViews?.toLocaleString()}</p>
  </div>
);

export default function ViralitySimulator({ deliverableId }) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    // Fetch initial data
    fetch(`/api/virality/${deliverableId}`).then(res => res.json()).then(setSimulation);
  }, [deliverableId]);

  const handleSimulate = async () => {
    setLoading(true);
    const res = await fetch('/api/virality/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId }),
    });
    const { simulationId } = await res.json();

    // Poll for results
    const interval = setInterval(() => {
      fetch(`/api/virality/${deliverableId}`).then(res => res.json()).then(data => {
        if (data && data.status === 'completed') {
          setSimulation(data);
          setLoading(false);
          clearInterval(interval);
        }
      });
    }, 3000);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Virality Simulator</h2>
        <button onClick={handleSimulate} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Simulating...' : 'Simulate Virality'}
        </button>
      </header>

      {simulation ? (
        <div className="space-y-4">
          {simulation.topPick && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">AI Recommendation</h3>
              <p className="text-sm mt-1">{simulation.aiSummary}</p>
              <button className="text-xs mt-2 px-2 py-1 border rounded-md">Copy Optimized Caption</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(simulation.variants || []).map(v => (
              <VariantCard key={v.id} variant={v} isTopPick={v.id === simulation.topPick?.id} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">Click "Simulate Virality" to generate and score creative variants.</p>
      )}
    </div>
  );
}
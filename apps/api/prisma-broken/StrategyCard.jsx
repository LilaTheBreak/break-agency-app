import React, { useState, useEffect } from 'react';

const Stat = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const StrategyBadge = ({ style }) => {
  const styles = {
    AGGRESSIVE: 'bg-red-100 text-red-800',
    BALANCED: 'bg-blue-100 text-blue-800',
    COLLABORATIVE: 'bg-green-100 text-green-800',
    PREMIUM_ONLY: 'bg-purple-100 text-purple-800',
  };
  return <span className={`px-3 py-1 text-sm font-bold rounded-full ${styles[style] || 'bg-gray-100'}`}>{style}</span>;
};

function useNegotiationStrategy(dealId) {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    fetch(`/api/deals/${dealId}/strategy`)
      .then(res => res.json())
      .then(setStrategy)
      .finally(() => setLoading(false));
  }, [dealId]);

  return { strategy, loading };
}

export default function StrategyCard({ dealId }) {
  const { strategy, loading } = useNegotiationStrategy(dealId);

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse"></div>;
  if (!strategy) return null;

  const { style, targetRate, floorRate, anchorRate, reasoning } = strategy;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">AI Negotiation Strategy</h3>
        <StrategyBadge style={style} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <Stat label="Floor Rate" value={new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(floorRate)} />
        <Stat label="Target Rate" value={new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(targetRate)} />
        <Stat label="Anchor Rate" value={new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(anchorRate)} />
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2">AI Reasoning:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          {(reasoning || []).map((reason, i) => <li key={i}>{reason}</li>)}
        </ul>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const Stat = ({ label, value, subtext = '' }) => (
  <div className="text-center">
    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
  </div>
);

function useDealPrediction(dealId) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    fetch(`/api/deals/${dealId}/prediction`)
      .then(res => res.json())
      .then(setPrediction)
      .finally(() => setLoading(false));
  }, [dealId]);

  return { prediction, loading };
}

export default function PredictionCard({ dealId }) {
  const { prediction, loading } = useDealPrediction(dealId);

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse"></div>;
  if (!prediction) return null;

  const { likelihood, expectedBudget, daysToClose, confidence, reasons } = prediction;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">AI Deal Prediction</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Likelihood to Close" value={`${(likelihood * 100).toFixed(0)}%`} />
        <Stat label="Expected Budget" value={new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(expectedBudget)} />
        <Stat label="Days to Close" value={daysToClose} />
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2">Key Factors:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          {(reasons || []).map((reason, i) => <li key={i}>{reason}</li>)}
        </ul>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">
        AI Confidence: {(confidence * 100).toFixed(0)}%
      </p>
    </div>
  );
}
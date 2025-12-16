import React, { useState, useEffect } from 'react';

const Stat = ({ label, value }) => (
  <div className="text-center">
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default function LiveStatePanel({ sessionId }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      fetch(`/api/negotiation/${sessionId}/live-state`)
        .then(res => res.json())
        .then(setState)
        .finally(() => setLoading(false));
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return <div className="p-4 text-sm">Awaiting live state...</div>;
  if (!state) return null;

  const { aiLastBrandIntent, aiLastBrandFee, aiAutoCounter } = state;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
      <h3 className="font-bold text-md mb-3">Live AI Analysis</h3>
      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold text-xs mb-2">Brand's Last Move:</h4>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Intent" value={aiLastBrandIntent || 'N/A'} />
          <Stat label="Counter Offer" value={aiLastBrandFee ? `£${aiLastBrandFee.toLocaleString()}` : 'N/A'} />
        </div>
      </div>
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
        <h4 className="font-semibold text-xs mb-2 text-blue-800 dark:text-blue-200">AI's Next Move:</h4>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Decision" value={aiAutoCounter?.decision || 'N/A'} />
          <Stat label="Next Offer" value={aiAutoCounter?.nextOffer ? `£${aiAutoCounter.nextOffer.toLocaleString()}` : 'N/A'} />
        </div>
      </div>
    </div>
  );
}
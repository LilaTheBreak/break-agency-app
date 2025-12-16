import React, { useState, useEffect } from 'react';

const Stat = ({ label, value, color = 'text-gray-900 dark:text-white' }) => (
  <div className="text-center">
    <div className={`text-xl font-bold ${color}`}>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const CounterOfferCard = ({ offer }) => (
  <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
    <div className="flex justify-between items-center">
      <h4 className="font-semibold text-blue-800 dark:text-blue-200 capitalize">{offer.variant} Counter</h4>
      <p className="font-bold text-lg">£{offer.suggestedValue.toLocaleString()}</p>
    </div>
    <p className="text-xs mt-1">{offer.justification}</p>
    <button className="text-xs mt-2 font-semibold text-blue-600">Use Script</button>
  </div>
);

export default function NegotiationSidebar({ threadId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    fetch(`/api/negotiation/${threadId}/summary`)
      .then(res => res.json())
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [threadId]);

  const handleAnalyse = async () => {
    setLoading(true);
    await fetch('/api/negotiation/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });
    // Poll for results
    setTimeout(() => {
      fetch(`/api/negotiation/${threadId}/summary`).then(res => res.json()).then(setSummary).finally(() => setLoading(false));
    }, 3000);
  };

  if (loading) return <div className="p-6 animate-pulse">Loading AI analysis...</div>;

  if (!summary || (!summary.benchmarks.length && !summary.redFlags.length)) {
    return <button onClick={handleAnalyse}>Run AI Negotiation Analysis</button>;
  }

  const benchmark = summary.benchmarks[0];

  return (
    <aside className="w-1/3 p-6 bg-gray-50 dark:bg-gray-900 border-l dark:border-gray-700 space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Negotiation Assistant</h2>
      </header>

      {benchmark && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-bold mb-3 text-center">Market Rate Benchmark</h3>
          <div className="flex justify-around items-center">
            <Stat label="Low" value={benchmark.marketLow} color="text-red-500" />
            <Stat label="Average" value={benchmark.marketAvg} color="text-yellow-500" />
            <Stat label="High" value={benchmark.marketHigh} color="text-green-500" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold">Counter-Offer Strategies</h3>
        {(summary.counterOffers || []).map(offer => <CounterOfferCard key={offer.id} offer={offer} />)}
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-red-600">Red Flags Detected</h3>
        {(summary.redFlags || []).map(flag => <p key={flag.id} className="text-sm"><strong>{flag.flag}</strong> ({flag.severity}): {flag.suggestion}</p>)}
      </div>
    </aside>
  );
}
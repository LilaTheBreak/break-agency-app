import React, { useState, useEffect } from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${className}`}>
    <h3 className="font-bold text-lg mb-3">{title}</h3>
    <div className="text-sm space-y-2">{children}</div>
  </div>
);

export default function AutoBriefPanel({ dealDraftId }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealDraftId) return;
    setLoading(true);
    fetch(`/api/campaign/auto-brief/${dealDraftId}`)
      .then(res => res.json())
      .then(setPlan)
      .finally(() => setLoading(false));
  }, [dealDraftId]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/campaign/auto-brief/${dealDraftId}`, { method: 'POST' });
    // Poll for results
    setTimeout(() => {
      fetch(`/api/campaign/auto-brief/${dealDraftId}`).then(res => res.json()).then(setPlan).finally(() => setLoading(false));
    }, 3000);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading AI Brief...</div>;
  }

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <h3 className="font-bold">No AI Brief Found</h3>
        <p className="text-sm text-gray-500 mb-4">Generate an AI-powered campaign plan for this deal draft.</p>
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate AI Brief
        </button>
      </div>
    );
  }

  const { aiSummary, deliverables, strategy, risks, talent } = plan;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">AI-Generated Campaign Plan</h2>
        <button onClick={handleGenerate} className="px-4 py-2 text-sm font-medium border rounded-md">
          Regenerate
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title="Campaign Summary">
            <p>{aiSummary}</p>
          </InfoCard>

          <InfoCard title="Deliverable Plan">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Platform</th>
                  <th className="p-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(deliverables || []).map((d, i) => (
                  <tr key={i} className="border-t dark:border-gray-700">
                    <td className="p-2">{d.type}</td>
                    <td className="p-2">{d.platform}</td>
                    <td className="p-2">{d.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfoCard>
        </div>
        <div className="space-y-8">
          <InfoCard title="Strategy" className="bg-blue-50 dark:bg-blue-900/50">
            <p><strong>Platform Mix:</strong> {strategy.platformMix}</p>
            <p><strong>Creative Direction:</strong> {strategy.creativeDirections?.join(', ')}</p>
            <p><strong>Timeline:</strong> {strategy.timeline}</p>
          </InfoCard>
          <InfoCard title="Identified Risks" className="bg-yellow-50 dark:bg-yellow-900/50">
            <ul className="list-disc list-inside">
              {(risks || []).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
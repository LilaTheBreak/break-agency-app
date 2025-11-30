import React, { useState, useEffect } from 'react';

const DraftCard = ({ draft }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
    <h4 className="font-bold">Contract for {draft.talent.user.name}</h4>
    <p className="text-xs text-gray-500">Status: {draft.status}</p>

    <div className="mt-4 space-y-2">
      <div className="bg-yellow-50 dark:bg-yellow-900/50 p-3 rounded-md">
        <h5 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">AI-Identified Risks</h5>
        <ul className="list-disc list-inside text-xs">
          {(draft.risksJson || []).map((risk, i) => <li key={i}>{risk.risk} ({risk.severity})</li>)}
        </ul>
      </div>

      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
        <h5 className="font-semibold text-sm">Key Terms</h5>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(draft.termsJson, null, 2)}</pre>
      </div>
    </div>

    <div className="mt-4 flex gap-2">
      <button className="flex-1 px-3 py-1.5 text-xs font-medium border rounded-md">View Full Contract</button>
      <button className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md">Send for Signature</button>
    </div>
  </div>
);

export default function ContractDraftsPanel({ aiPlanId }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aiPlanId) return;
    setLoading(true);
    // Poll for results
    const interval = setInterval(() => {
      fetch(`/api/contracts/${aiPlanId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setDrafts(data);
            setLoading(false);
            clearInterval(interval);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [aiPlanId]);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">AI-Generated Contracts</h2>
        <p className="text-sm text-gray-500">Draft agreements for each talent in the campaign plan.</p>
      </header>

      {loading ? (
        <p>AI is drafting the legal agreements...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drafts.map(draft => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    </div>
  );
}
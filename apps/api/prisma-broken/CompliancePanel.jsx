import React, { useState, useEffect } from 'react';
import ComplianceBadge from './ComplianceBadge';

const IssueItem = ({ issue }) => (
  <div className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/50">
    <p className="font-semibold">{issue.type}</p>
    <p className="text-sm">{issue.message}</p>
  </div>
);

export default function CompliancePanel({ deliverableId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    setLoading(true);
    fetch(`/api/compliance/${deliverableId}/history`)
      .then(res => res.json())
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [deliverableId]);

  const handleRunCheck = async () => {
    setLoading(true);
    await fetch('/api/compliance/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId }),
    });
    // Poll for results after a delay
    setTimeout(() => {
      fetch(`/api/compliance/${deliverableId}/history`).then(res => res.json()).then(setHistory).finally(() => setLoading(false));
    }, 3000);
  };

  const latestCheck = history[0];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Compliance Check</h2>
        <button onClick={handleRunCheck} disabled={loading} className="px-4 py-2 text-sm font-medium border rounded-md">
          {loading ? 'Checking...' : 'Run New Check'}
        </button>
      </header>

      {latestCheck ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ComplianceBadge status={latestCheck.status} />
            <p className="font-bold text-2xl">{latestCheck.score}/100</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Issues Found:</h3>
            <div className="space-y-2">
              {(latestCheck.issues || []).map((issue, i) => <IssueItem key={i} issue={issue} />)}
            </div>
          </div>
          <button className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Apply AI Fixes</button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No compliance checks have been run for this deliverable yet.</p>
      )}
    </div>
  );
}
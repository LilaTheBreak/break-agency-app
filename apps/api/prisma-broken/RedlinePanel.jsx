import React, { useState, useEffect } from 'react';

const RiskPill = ({ risk }) => (
  <span className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
    {risk}
  </span>
);

const RedlineItem = ({ redline }) => (
  <div className="p-4 border rounded-md dark:border-gray-700">
    <h4 className="font-semibold">{redline.clause}</h4>
    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/50 rounded-md">
      <p className="text-xs font-bold text-red-700 dark:text-red-200">Issue:</p>
      <p className="text-sm">{redline.issue}</p>
    </div>
    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/50 rounded-md">
      <p className="text-xs font-bold text-green-700 dark:text-green-200">Suggestion:</p>
      <p className="text-sm">{redline.suggestion}</p>
    </div>
    <div className="flex gap-2 mt-3">
      <button className="text-xs px-2 py-1 border rounded-md">Accept</button>
      <button className="text-xs px-2 py-1 border rounded-md">Regenerate</button>
    </div>
  </div>
);

export default function RedlinePanel({ contractReviewId }) {
  const [redlineData, setRedlineData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartRedline = async () => {
    setLoading(true);
    await fetch('/api/contract/ai/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractReviewId }),
    });
    // Poll for results
    setTimeout(() => {
      fetch(`/api/contracts/${contractReviewId}/redline/preview`)
        .then(res => res.json())
        .then(setRedlineData)
        .finally(() => setLoading(false));
    }, 3000);
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Contract Redline Assistant</h2>
        <button onClick={handleStartRedline} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </header>

      {redlineData && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-2">High-Level Risks</h3>
            <div className="flex flex-wrap gap-2">
              {(redlineData.aiRisks || []).map((risk, i) => <RiskPill key={i} risk={risk} />)}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Clause-by-Clause Redlines</h3>
            <div className="space-y-4">
              {(redlineData.aiRedlines || []).map((rl, i) => <RedlineItem key={i} redline={rl} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
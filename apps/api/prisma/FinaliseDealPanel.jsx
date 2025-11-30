import React, { useState, useEffect } from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${className}`}>
    <h3 className="font-bold text-lg mb-3">{title}</h3>
    <div className="text-sm space-y-2">{children}</div>
  </div>
);

export default function FinaliseDealPanel({ threadId }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartFinalise = async () => {
    setLoading(true);
    await fetch(`/api/threads/${threadId}/finalise/start`, { method: 'POST' });
    // Poll for status or use websockets
    setTimeout(() => {
      fetch(`/api/threads/${threadId}/finalise/status`)
        .then(res => res.json())
        .then(setPreview)
        .finally(() => setLoading(false));
    }, 3000); // Simulate processing time
  };

  const handleConfirm = async () => {
    setLoading(true);
    await fetch(`/api/threads/${threadId}/finalise/confirm`, { method: 'POST' });
    alert('Contract sent for signature!');
    setLoading(false);
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">AI Deal Finaliser</h2>
        <p className="text-sm text-gray-500">Generate and review the final contract and SOW.</p>
      </header>

      {!preview && (
        <button onClick={handleStartFinalise} disabled={loading} className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating Preview...' : 'Start Finalisation'}
        </button>
      )}

      {preview && (
        <div className="space-y-6">
          <InfoCard title="AI Offer Summary">
            <p>{preview.aiSummary?.summary}</p>
          </InfoCard>

          <InfoCard title="Statement of Work (SOW)">
            <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              {JSON.stringify(preview.aiDealMapping, null, 2)}
            </pre>
          </InfoCard>

          <div className="flex justify-end gap-4">
            <button className="px-4 py-2 text-sm font-medium border rounded-md">Edit Manually</button>
            <button onClick={handleConfirm} disabled={loading} className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-md">
              {loading ? 'Sending...' : 'Approve & Send for Signature'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
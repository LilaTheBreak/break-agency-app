import React, { useState } from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${className}`}>
    <h3 className="font-bold mb-2">{title}</h3>
    <div className="text-sm">{children}</div>
  </div>
);

// This component would be passed the results from the deal closer service
export default function DealCloserPanel({ dealClosureData }) {
  const [isSending, setIsSending] = useState(false);

  const handleApproveAndSend = async () => {
    setIsSending(true);
    // API call to a route that triggers the final send-for-signature step
    console.log('Approving and sending contract...');
    setTimeout(() => setIsSending(false), 2000);
  };

  if (!dealClosureData) {
    return <div className="p-6">No deal closure information available.</div>;
  }

  const { summary, redlines, contractJson } = dealClosureData;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Deal Closer</h2>
        <p className="text-sm text-gray-500">Review the final terms before sending the contract.</p>
      </header>

      <InfoCard title="AI Agreement Summary">
        <ul className="list-disc list-inside space-y-1">
          <li>Budget: {summary.budget}</li>
          {/* Render other summary points */}
        </ul>
      </InfoCard>

      <InfoCard title="AI Contract Redlines" className="bg-yellow-50 dark:bg-yellow-900/50">
        <ul className="list-disc list-inside text-yellow-800 dark:text-yellow-200 space-y-1">
          {(redlines.warnings || []).map((warning, i) => <li key={i}>{warning}</li>)}
          {(redlines.redlines || []).map((rl, i) => (
            <li key={i}><strong>{rl.term}:</strong> {rl.suggestion}</li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard title="Final Offer Preview">
        <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded">
          {JSON.stringify(contractJson, null, 2)}
        </pre>
      </InfoCard>

      <div className="flex justify-end gap-4">
        <button className="px-4 py-2 text-sm font-medium border rounded-md">Edit Manually</button>
        <button onClick={handleApproveAndSend} disabled={isSending} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md disabled:bg-blue-300">
          {isSending ? 'Sending...' : 'Approve & Send Contract'}
        </button>
      </div>
    </div>
  );
}
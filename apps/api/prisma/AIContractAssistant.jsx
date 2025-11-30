import React, { useState } from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${className}`}>
    <h3 className="font-bold text-lg mb-3">{title}</h3>
    <div className="text-sm space-y-2">{children}</div>
  </div>
);

// This component would be used within a Deal or Contract page.
export default function AIContractAssistant({ dealDraftId }) {
  const [contract, setContract] = useState(null);
  const [redlines, setRedlines] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateContract = async () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setContract({
        clauses: [{ title: 'Payment', content: 'Client shall pay Talent £5,000 net-30.' }],
      });
      setLoading(false);
    }, 1500);
  };

  const handleReviewContract = async () => {
    setLoading(true);
    // Mock API call for redlining
    setTimeout(() => {
      setRedlines({
        aiRisks: ["Payment term is Net-60, which is longer than standard Net-30."],
        aiRedlines: [{ clause: "Section 4.2", issue: "Net-60 Payment", suggestion: "Request change to Net-30." }],
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">AI Contract Assistant</h1>
        <p className="text-gray-500">Generate a new contract or review an uploaded one.</p>
      </header>

      <div className="flex gap-4">
        <button onClick={handleGenerateContract} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating...' : 'Generate AI Contract'}
        </button>
        <button className="px-4 py-2 font-medium border rounded-md">Upload Brand Contract</button>
        <button onClick={handleReviewContract} disabled={loading} className="px-4 py-2 font-medium border rounded-md">
          {loading ? 'Analyzing...' : 'Run AI Redline'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {contract && (
          <InfoCard title="Generated Contract Draft">
            {(contract.clauses || []).map((c, i) => (
              <div key={i}>
                <h4 className="font-semibold">{c.title}</h4>
                <p>{c.content}</p>
              </div>
            ))}
            <button className="mt-4 text-sm font-medium text-blue-500">Download PDF</button>
          </InfoCard>
        )}

        {redlines && (
          <InfoCard title="AI Redline Analysis" className="bg-yellow-50 dark:bg-yellow-900/50">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Risks</h4>
                <ul className="list-disc list-inside">{(redlines.aiRisks || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Redlines</h4>
                <ul className="list-disc list-inside">{(redlines.aiRedlines || []).map((r, i) => <li key={i}><strong>{r.clause}:</strong> {r.suggestion}</li>)}</ul>
              </div>
            </div>
          </InfoCard>
        )}
      </div>
    </div>
  );
}
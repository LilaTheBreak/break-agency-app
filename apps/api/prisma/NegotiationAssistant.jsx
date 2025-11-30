import React, { useState, useEffect } from 'react';

const StatCard = ({ label, value }) => (
  <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const RedFlagItem = ({ flag }) => (
  <li className="text-sm text-red-700 dark:text-red-300">{flag.risk}: {flag.suggestion}</li>
);

export default function NegotiationAssistant({ threadId }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    fetchData();
  }, [threadId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/negotiation/thread/${threadId}`)
      .then(res => res.json())
      .then(setThread)
      .finally(() => setLoading(false));
  };

  // This would be triggered from an email view
  const handleAnalyze = async (emailId) => {
    setLoading(true);
    await fetch(`/api/negotiation/${emailId}/analyze`, { method: 'POST' });
    setTimeout(fetchData, 5000); // Poll for results
  };

  if (loading) return <div className="p-6 text-center">Loading negotiation assistant...</div>;
  if (!thread) return <div className="p-6">No negotiation data found.</div>;

  const latestMessage = thread.messages?.[thread.messages.length - 1];
  const analysis = latestMessage?.aiScoring;
  const strategy = latestMessage?.responsePlan;

  if (!analysis) {
    return <div className="p-6 text-center"><button onClick={() => handleAnalyze('some_email_id')}>Analyze Latest Email</button></div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Negotiation Deep Assistant</h2>
        <p className="text-sm text-gray-500">Analysis & Strategy for thread with {thread.brandName}</p>
      </header>

      <div>
        <h3 className="font-bold mb-2">Rate Prediction</h3>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Minimum" value={`£${analysis.ratePrediction.min.toLocaleString()}`} />
          <StatCard label="Target" value={`£${analysis.ratePrediction.target.toLocaleString()}`} />
          <StatCard label="Premium" value={`£${analysis.ratePrediction.premium.toLocaleString()}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-2 text-red-500">Red Flags Detected</h3>
          <ul className="list-disc list-inside space-y-1">
            {(analysis.redFlags || []).map((flag, i) => <RedFlagItem key={i} flag={flag} />)}
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-2">Negotiation Strategy</h3>
          <div className="text-sm space-y-1">
            <p><strong>Opening:</strong> {strategy.openingMove.details}</p>
            <p><strong>Fallback:</strong> {strategy.fallbackPosition.details}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">AI-Generated Reply Draft</h3>
        <div className="p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-semibold">{latestMessage.subject}</p>
          <p className="text-sm mt-2 whitespace-pre-wrap">{latestMessage.body}</p>
        </div>
        <button className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">Approve & Send</button>
      </div>
    </div>
  );
}
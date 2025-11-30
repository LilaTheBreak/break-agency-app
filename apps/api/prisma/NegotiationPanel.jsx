import React, { useState, useEffect } from 'react';

const MessageBubble = ({ message }) => (
  <div className={`flex ${message.sender === 'ai' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-lg p-3 rounded-lg ${message.sender === 'ai' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <p className="text-sm">{message.body}</p>
    </div>
  </div>
);

const AIActionPanel = ({ decision }) => {
  if (!decision) return null;
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
      <h4 className="font-bold text-blue-800 dark:text-blue-200">AI Recommended Action</h4>
      <p className="text-sm mt-1"><strong>Decision:</strong> {decision.decisionType}</p>
      <p className="text-sm"><strong>Reasoning:</strong> {decision.reasoning}</p>
      <div className="mt-3 flex gap-2">
        <button className="text-xs px-3 py-1 border rounded-md">Edit & Send</button>
        <button className="text-xs px-3 py-1 text-white bg-green-600 rounded-md">Approve & Send</button>
      </div>
    </div>
  );
};

export default function NegotiationPanel({ threadId }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    fetchData();
  }, [threadId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/negotiation/${threadId}`)
      .then(res => res.json())
      .then(setThread)
      .finally(() => setLoading(false));
  };

  const handleRespond = async () => {
    setLoading(true);
    await fetch('/api/negotiation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });
    // Poll for results
    setTimeout(fetchData, 5000);
  };

  if (loading) return <div className="p-6">Loading negotiation...</div>;
  if (!thread) return null;

  const latestDecision = thread.decisions?.[0];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l">
      <header className="p-4 border-b dark:border-gray-700">
        <h2 className="font-bold">AI Negotiation Assistant</h2>
        <p className="text-xs text-gray-500">Thread: {thread.id}</p>
      </header>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {(thread.messages || []).map(msg => <MessageBubble key={msg.id} message={msg} />)}
      </div>

      <footer className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <AIActionPanel decision={latestDecision} />
        <button onClick={handleRespond} disabled={loading} className="w-full mt-2 px-4 py-2 text-sm font-medium border rounded-md">
          {loading ? 'AI is Thinking...' : 'Trigger AI Response'}
        </button>
      </footer>
    </div>
  );
}
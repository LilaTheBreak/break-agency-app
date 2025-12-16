import React, { useState, useEffect } from 'react';

const MessageBubble = ({ turn }) => (
  <div className={`flex ${turn.actor === 'ai' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-lg p-3 rounded-lg ${turn.actor === 'ai' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <p className="text-sm">{turn.body}</p>
      <div className="text-xs opacity-70 mt-1 text-right">{new Date(turn.createdAt).toLocaleTimeString()}</div>
    </div>
  </div>
);

const PolicyIndicator = ({ label, enabled }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
    <span>{label}</span>
  </div>
);

async function generateReply(threadId) {
  const res = await fetch('/api/ai/negotiation/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId }),
  });
  if (!res.ok) throw new Error('Failed to generate reply');
  return res.json();
}

export default function RealTimePanel({ threadId }) {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');

  // Mock fetching turns
  useEffect(() => {
    setLoading(true);
    // In a real app, you'd fetch from `/api/negotiation/thread/${threadId}/turns`
    setTimeout(() => {
      setTurns([
        { id: 1, actor: 'brand', body: 'Thanks for the proposal. The price is a bit higher than our budget. Can we do it for £5,000?', createdAt: new Date() },
      ]);
      setLoading(false);
    }, 500);
  }, [threadId]);

  const handleGenerateReply = async () => {
    setLoading(true);
    try {
      const result = await generateReply(threadId);
      setReply(result.reply);
    } catch (error) {
      console.error(error);
      setReply('Error generating reply.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l">
      <header className="p-4 border-b dark:border-gray-700">
        <h2 className="font-bold">Live Negotiation</h2>
        <div className="flex gap-4 mt-2">
          <PolicyIndicator label="Sandbox Mode" enabled={false} />
          <PolicyIndicator label="Auto-Send" enabled={true} />
        </div>
      </header>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {turns.map(turn => <MessageBubble key={turn.id} turn={turn} />)}
        {loading && <div className="text-sm text-center">Thinking...</div>}
      </div>

      <footer className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="AI-generated reply will appear here..."
          className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
          rows={5}
        />
        <div className="mt-2 flex justify-between">
          <button onClick={handleGenerateReply} className="px-4 py-2 text-sm font-medium border rounded-md">
            {loading ? 'Generating...' : 'Generate Reply'}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
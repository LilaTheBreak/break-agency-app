import React, { useState, useEffect } from 'react';

export default function AISuggestionCard({ threadId }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    fetch(`/api/inbox/reply-suggestions/${threadId}`)
      .then(res => res.json())
      .then(data => setSuggestion(data[0])) // Get the latest suggestion
      .finally(() => setLoading(false));
  }, [threadId]);

  const handleApprove = async () => {
    await fetch(`/api/inbox/reply-suggestions/${suggestion.id}/approve`, { method: 'POST' });
    setSuggestion(null); // Hide card after action
  };

  if (loading || !suggestion) {
    return null; // Don't show anything if there's no suggestion or it's loading
  }

  return (
    <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500 rounded-r-lg">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-blue-800 dark:text-blue-200">AI Suggested Reply</h4>
        <span className="text-xs text-blue-600">Confidence: {(suggestion.confidence * 100).toFixed(0)}%</span>
      </div>

      <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
        <p className="text-sm font-semibold">{suggestion.aiSubject}</p>
        <p className="mt-1 text-sm whitespace-pre-wrap">{suggestion.aiBody}</p>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button
          className="px-3 py-1 text-xs font-medium border rounded-md"
          onClick={() => setSuggestion(null)} // Simple reject
        >
          Reject
        </button>
        <button className="px-3 py-1 text-xs font-medium border rounded-md">
          Edit
        </button>
        <button
          onClick={handleApprove}
          className="px-4 py-1 text-xs font-semibold text-white bg-green-600 rounded-md"
        >
          Approve & Send
        </button>
      </div>
    </div>
  );
}
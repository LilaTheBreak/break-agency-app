import React, { useState, useEffect } from 'react';

export default function AutoReplyPanel({ emailId }) {
  const [reply, setReply] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!emailId) return;
    fetchData();
  }, [emailId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/inbox/${emailId}/reply`)
      .then(res => res.json())
      .then(setReply)
      .finally(() => setLoading(false));
  };

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/inbox/${emailId}/auto-reply`, { method: 'POST' });
    setTimeout(fetchData, 3000); // Poll for results
  };

  const handleSend = async () => {
    await fetch(`/api/inbox/${emailId}/auto-reply/send`, { method: 'POST' });
    fetchData(); // Refresh status
  };

  if (loading) return <div className="p-4 text-center text-sm">AI is thinking...</div>;

  if (!reply) {
    return <button onClick={handleGenerate} className="w-full text-sm p-2 border rounded-md">Generate AI Reply</button>;
  }

  if (reply.status === 'sent') {
    return <div className="p-3 text-sm text-center bg-green-100 text-green-800 rounded-md">Reply Sent</div>;
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
      <h4 className="font-bold text-blue-800 dark:text-blue-200">AI Suggested Reply</h4>
      <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
        <p className="text-sm">{reply.replyText}</p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={handleSend} className="px-4 py-1 text-xs font-semibold text-white bg-green-600 rounded-md">
          Approve & Send
        </button>
      </div>
    </div>
  );
}
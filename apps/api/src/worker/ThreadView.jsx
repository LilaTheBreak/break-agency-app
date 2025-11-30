import React, { useState, useEffect } from 'react';
import * as emailApi from '../../services/emailApi';

const MessageBubble = ({ message }) => (
  <div className="p-4 my-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <div className="flex justify-between items-center text-sm mb-2">
      <span className="font-semibold">{message.from}</span>
      <span className="text-gray-500">{new Date(message.date).toLocaleString()}</span>
    </div>
    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.body }} />
  </div>
);

export default function ThreadView({ threadId }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    emailApi.getThread(threadId)
      .then(setThread)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [threadId]);

  if (loading) return <div className="p-4 animate-pulse">Loading thread...</div>;
  if (!thread || thread.length === 0) return null;

  return (
    <div className="p-4">
      <h3 className="font-bold mb-4">Conversation History</h3>
      {thread.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
import React, { useState } from 'react';

export default function ApprovalActions({ review, onUpdate }) {
  const [feedback, setFeedback] = useState('');

  const handleAction = async (action) => {
    await fetch(`/api/creative-review/${review.id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: feedback }),
    });
    setFeedback('');
    onUpdate();
  };

  if (review.status !== 'in_review') {
    return <p className="text-xs text-center text-gray-500">This review is {review.status}.</p>;
  }

  return (
    <div className="space-y-2">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Add feedback before requesting changes..."
        className="w-full p-2 text-sm border rounded-md"
        rows={2}
      />
      <div className="flex gap-2">
        <button onClick={() => handleAction('request-changes')} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-md">Request Changes</button>
        <button onClick={() => handleAction('approve')} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md">Approve</button>
      </div>
    </div>
  );
}
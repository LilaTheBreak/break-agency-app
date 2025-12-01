import React, { useState, useEffect } from 'react';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  needs_edits: 'bg-red-100 text-red-800',
};

const Comment = ({ comment }) => (
  <div className="flex items-start gap-3 py-2">
    <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-8 h-8 rounded-full" />
    <div>
      <p className="text-sm font-semibold">{comment.user.name}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{comment.message}</p>
    </div>
  </div>
);

export default function ApprovalTab({ entityType, entityId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/approvals/${entityType}/${entityId}`);
      if (res.ok) setHistory(await res.json());
    } catch (error) {
      console.error('Failed to fetch approval history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [entityType, entityId]);

  const handleAction = async (action) => {
    const currentRequest = history[0];
    if (!currentRequest) return;

    await fetch(`/api/approvals/${currentRequest.id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: comment }),
    });
    setComment('');
    fetchHistory();
  };

  if (loading) return <div className="p-4">Loading approval status...</div>;

  const latestRequest = history[0];

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">Approval Workflow</h3>
      {!latestRequest && <p>No approval request has been submitted for this item yet.</p>}

      {latestRequest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Assessment Panel */}
          <div className="md:col-span-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2">AI Assessment</h4>
            <p className="text-4xl font-bold text-center mb-2">{latestRequest.aiAssessment.score}/100</p>
            <div className="text-xs space-y-2">
              <p className="font-semibold">Required Fixes:</p>
              <ul className="list-disc list-inside text-red-500">
                {latestRequest.aiAssessment.requiredFixes.map((fix, i) => <li key={i}>{fix}</li>)}
              </ul>
              <p className="font-semibold mt-2">Suggestions:</p>
              <ul className="list-disc list-inside text-blue-500">
                {latestRequest.aiAssessment.suggestions.map((sugg, i) => <li key={i}>{sugg}</li>)}
              </ul>
            </div>
          </div>

          {/* History and Actions */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Version {latestRequest.version}</h4>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[latestRequest.status]}`}>
                {latestRequest.status.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 border rounded-lg max-h-64 overflow-y-auto">
              {latestRequest.comments.length > 0 ? (
                latestRequest.comments.map(c => <Comment key={c.id} comment={c} />)
              ) : (
                <p className="text-sm text-gray-400">No comments yet.</p>
              )}
            </div>

            {/* Action Form */}
            {latestRequest.status === 'pending' && (
              <div className="mt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add feedback for the creator..."
                  className="w-full p-2 border rounded-md"
                  rows="3"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => handleAction('request-edits')} className="px-4 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-md">
                    Request Edits
                  </button>
                  <button onClick={() => handleAction('approve')} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md">
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
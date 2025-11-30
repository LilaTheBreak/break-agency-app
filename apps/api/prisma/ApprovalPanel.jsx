import React, { useState, useEffect } from 'react';

const HistoryItem = ({ item }) => (
  <li className="border-l-2 pl-4 pb-4">
    <p className="font-semibold text-sm">{item.action} by {item.actor}</p>
    {item.comments && <p className="text-xs italic text-gray-600 dark:text-gray-400">"{item.comments}"</p>}
    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
  </li>
);

export default function ApprovalPanel({ deliverable }) {
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (!deliverable) return;
    fetch(`/api/approvals/${deliverable.id}/history`)
      .then(res => res.json())
      .then(setHistory);
  }, [deliverable]);

  const handleApprove = async () => {
    await fetch(`/api/approvals/${deliverable.id}/manager/approve`, { method: 'POST' });
    alert('Approved!');
  };

  const handleReject = async () => {
    await fetch(`/api/approvals/${deliverable.id}/manager/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
    });
    alert('Rejected!');
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">Approval Workflow</h3>

      {deliverable.status === 'pending_manager_approval' && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold mb-2">Manager Action Required</h4>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Add rejection comments (optional)..."
            className="w-full p-2 border rounded-md text-sm dark:bg-gray-700"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={handleReject} className="flex-1 px-3 py-1 text-sm border rounded-md bg-red-500 text-white">Reject</button>
            <button onClick={handleApprove} className="flex-1 px-3 py-1 text-sm border rounded-md bg-green-500 text-white">Approve & Send to Brand</button>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-2">Approval History</h4>
        <ul>
          {history.map(item => <HistoryItem key={item.id} item={item} />)}
        </ul>
      </div>
    </div>
  );
}
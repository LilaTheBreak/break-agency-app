import React, { useState, useEffect } from 'react';

export default function FollowUpStatusPanel({ deliverableId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetchData();
  }, [deliverableId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/followups/${deliverableId}/status`)
      .then(res => res.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  };

  const handleToggle = async () => {
    const action = status?.autoFollowUpEnabled ? 'cancel' : 'schedule';
    await fetch(`/api/followups/${deliverableId}/${action}`, { method: 'POST' });
    fetchData();
  };

  if (loading) return <div className="p-4 text-sm">Loading follow-up status...</div>;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">Auto Follow-Up</h4>
        <button onClick={handleToggle} className="text-xs px-2 py-1 border rounded-md">
          {status?.autoFollowUpEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
      {status?.autoFollowUpEnabled ? (
        <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">
          <p>Status: <span className="font-bold text-green-600">Active</span></p>
          <p>Follow-ups sent: {status.followUpCount}</p>
          {status.lastBrandFollowUpAt && <p>Last sent: {new Date(status.lastBrandFollowUpAt).toLocaleDateString()}</p>}
        </div>
      ) : (
        <p className="text-xs mt-2 text-gray-500">Auto follow-ups are currently disabled for this deliverable.</p>
      )}
    </div>
  );
}
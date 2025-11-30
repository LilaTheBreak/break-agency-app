import React, { useState, useEffect } from 'react';

const DeadlineItem = ({ item }) => {
  const statusColors = {
    overdue: 'bg-red-100 border-red-500',
    at_risk: 'bg-yellow-100 border-yellow-500',
    active: 'bg-green-100 border-green-500',
  };

  return (
    <div className={`p-3 border-l-4 rounded-r-md ${statusColors[item.status] || 'bg-gray-100'}`}>
      <div className="flex justify-between items-center">
        <p className="font-semibold text-sm">{item.entityType.replace('_', ' ')}</p>
        <p className="text-xs font-bold">{new Date(item.dueAt).toLocaleDateString()}</p>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.aiSummary}</p>
    </div>
  );
};

export default function DeadlineRadar({ talentId }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!talentId) return;
    setLoading(true);
    fetch(`/api/deadlines/talent/${talentId}`)
      .then(res => res.json())
      .then(setDeadlines)
      .finally(() => setLoading(false));
  }, [talentId]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Deadline Radar</h2>
        <button className="px-3 py-1 text-sm border rounded-md">Refresh</button>
      </header>

      {loading ? (
        <p>Loading deadlines...</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {deadlines.length > 0 ? (
            deadlines.map(item => <DeadlineItem key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-gray-500">No active deadlines found.</p>
          )}
        </div>
      )}
    </div>
  );
}
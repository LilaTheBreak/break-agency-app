import React, { useState, useEffect } from 'react';

const fetchLatestRun = async () => {
  // In a real app, this would be a dedicated endpoint, e.g., /api/negotiation/agent/latest-run
  // For now, we'll use mock data.
  return {
    id: 'run_123',
    status: 'completed',
    summary: {
      actions: [
        { threadId: 'thread_abc', action: 'ENQUEUE_REPLY', priority: 'HIGH' },
        { threadId: 'thread_def', action: 'ENQUEUE_FOLLOW_UP', priority: 'MEDIUM' },
      ],
      conflicts: [
        { type: 'EXCLUSIVITY', threadA: 'thread_abc', threadB: 'thread_xyz', severity: 'high', notes: 'Exclusivity conflict between Brand A and Brand C' }
      ],
      ignored: [
        { threadId: 'thread_ghi', reason: 'Priority was LOW' }
      ],
    },
    createdAt: new Date().toISOString(),
  };
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority] || 'bg-gray-100'}`}>{priority}</span>;
};

export default function AgentDashboard() {
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestRun().then(data => {
      setLatestRun(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading Agent Dashboard...</div>;
  if (!latestRun) return <div>No agent run data available.</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Negotiation Dashboard</h2>
        <p className="text-sm text-gray-500">
          Last run at {new Date(latestRun.createdAt).toLocaleString()}
        </p>
      </header>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">AI Actions Queued ({latestRun.summary.actions.length})</h3>
        <ul className="space-y-2">
          {latestRun.summary.actions.map((action, i) => (
            <li key={i} className="flex justify-between items-center text-sm">
              <span>Thread <span className="font-mono">{action.threadId.slice(0, 8)}...</span></span>
              <PriorityBadge priority={action.priority} />
              <button className="text-xs text-blue-500">Force Reply Now</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg">
        <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">Global Conflicts Detected ({latestRun.summary.conflicts.length})</h3>
        {latestRun.summary.conflicts.map((conflict, i) => (
          <p key={i} className="text-sm text-red-700 dark:text-red-300">{conflict.notes}</p>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const ExecutionRow = ({ execution }) => {
  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <tr className="border-b dark:border-gray-700">
      <td className="p-3 text-xs">{new Date(execution.createdAt).toLocaleString()}</td>
      <td className="p-3 text-sm font-medium">{execution.eventType}</td>
      <td className="p-3 text-sm">{execution.pipeline}</td>
      <td className="p-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)}`}>
          {execution.status}
        </span>
      </td>
    </tr>
  );
};

export default function AgentStatusDashboard() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This endpoint would need to be created to fetch from AgentExecution
    // fetch('/api/agent/history')
    //   .then(res => res.json())
    //   .then(setExecutions)
    //   .finally(() => setLoading(false));
    setLoading(false); // Mock
  }, []);

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Autonomous Agent Status</h1>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="p-3">Timestamp</th>
            <th className="p-3">Event</th>
            <th className="p-3">Pipeline</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {executions.map(exec => <ExecutionRow key={exec.id} execution={exec} />)}
        </tbody>
      </table>
      {executions.length === 0 && !loading && <p className="text-center p-8 text-gray-500">No agent activity recorded yet.</p>}
    </div>
  );
}
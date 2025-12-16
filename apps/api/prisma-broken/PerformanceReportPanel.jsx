import React, { useState, useEffect } from 'react';
// Assuming you have a charting library like 'recharts' installed
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceReportPanel({ deliverable }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliverable?.id) return;
    setLoading(true);
    fetch(`/api/deliverables/${deliverable.id}/performance`)
      .then(res => res.json())
      .then(setSnapshots)
      .finally(() => setLoading(false));
  }, [deliverable?.id]);

  if (loading) return <div className="p-6">Loading performance data...</div>;
  if (snapshots.length === 0) return <div className="p-6">No performance data available yet.</div>;

  const chartData = snapshots.map(s => ({
    name: new Date(s.capturedAt).toLocaleTimeString(),
    views: s.views,
    likes: s.likes,
  }));

  const latestSnapshot = snapshots[snapshots.length - 1];
  const aiSummary = deliverable.aiPerformanceSummary;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">AI Performance Report</h2>
        <p className="text-sm text-gray-500">Real-time metrics and insights for this deliverable.</p>
      </header>

      <div className="h-72 w-full mb-8">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#8884d8" />
            <Line type="monotone" dataKey="likes" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {aiSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">AI Summary</h3>
            <p className="text-sm mt-1">{aiSummary.summary}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200">AI Recommendations</h3>
            <ul className="list-disc list-inside text-sm mt-1">
              {(aiSummary.recommendations || []).map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
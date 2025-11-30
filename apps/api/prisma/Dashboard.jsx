import React, { useState, useEffect } from 'react';

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-1 text-2xl font-semibold">{value}</p>
  </div>
);

const TaskItem = ({ task }) => (
  <div className="p-3 border-b dark:border-gray-700">
    <p className="font-semibold">{task.title}</p>
    <p className="text-xs text-gray-500">{task.taskType}</p>
  </div>
);

async function fetchData() {
  const [tasksRes, analyticsRes] = await Promise.all([
    fetch('/api/creator/tasks'),
    fetch('/api/creator/analytics'),
  ]);
  return {
    tasks: await tasksRes.json(),
    analytics: await analyticsRes.json(),
  };
}

export default function CreatorDashboard() {
  const [data, setData] = useState({ tasks: [], analytics: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading Dashboard...</div>;

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Your AI assistant's overview for today.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard title="Followers" value={data.analytics.followerCount?.toLocaleString()} />
        <StatCard title="Engagement" value={`${data.analytics.engagementRate?.toFixed(2)}%`} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="p-4 font-bold text-lg border-b dark:border-gray-700">Today's Tasks</h2>
        <div>
          {data.tasks.length > 0 ? (
            data.tasks.map(task => <TaskItem key={task.id} task={task} />)
          ) : (
            <p className="p-4 text-sm text-gray-500">No urgent tasks today. Great job!</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-6">
        <h2 className="p-4 font-bold text-lg border-b dark:border-gray-700">Smart Actions</h2>
        <div className="p-4 space-y-2">
          <button className="w-full p-3 text-left bg-blue-50 dark:bg-blue-900/50 rounded-md font-semibold text-blue-700 dark:text-blue-300">
            Draft captions for "New Vlog"
          </button>
          <button className="w-full p-3 text-left bg-blue-50 dark:bg-blue-900/50 rounded-md font-semibold text-blue-700 dark:text-blue-300">
            Draft follow-up to "Brand Collab"
          </button>
        </div>
      </div>
    </div>
  );
}
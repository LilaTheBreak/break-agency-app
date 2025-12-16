import React, { useState, useEffect } from 'react';

const HealthStat = ({ label, value, colorClass }) => (
  <div className="text-center">
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default function CreatorHealthWidget({ userId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/health/creator/${userId}`)
      .then(res => res.json())
      .then(setHealth)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse"></div>;
  if (!health) return <div className="p-6">No health data available.</div>;

  const { workloadScore, burnoutRisk, capacityForecast, aiSummary } = health;

  const getRiskColor = (risk) => {
    if (risk > 0.7) return 'text-red-500';
    if (risk > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Creator Health Index</h2>
        <button className="px-3 py-1 text-sm border rounded-md">Refresh</button>
      </header>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md mb-4">
        <p className="text-sm text-center">{aiSummary}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <HealthStat
          label="Workload Score"
          value={workloadScore.toFixed(0)}
          colorClass={getRiskColor(workloadScore / 100)}
        />
        <HealthStat
          label="Burnout Risk"
          value={`${(burnoutRisk * 100).toFixed(0)}%`}
          colorClass={getRiskColor(burnoutRisk)}
        />
        <HealthStat label="Capacity (30d)" value={`${capacityForecast}%`} colorClass="text-gray-900 dark:text-white" />
      </div>
    </div>
  );
}
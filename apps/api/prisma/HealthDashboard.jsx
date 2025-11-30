import React, { useState, useEffect } from 'react';

const StatCard = ({ title, value, children }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    {children}
  </div>
);

const BurnoutWarning = ({ risk }) => {
  if (risk < 0.5) return null;
  const riskLevel = risk > 0.75 ? 'High' : 'Medium';
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg">
      <h4 className="font-bold">{riskLevel} Burnout Risk Detected</h4>
      <p className="text-sm">Workload and stress levels are high. Consider reducing commitments.</p>
    </div>
  );
};

async function fetchHealthSummary() {
  const res = await fetch('/api/talent-health/summary');
  if (!res.ok) return null;
  return res.json();
}

export default function HealthDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading Talent Health...</div>;
  if (!summary) return <div>No health data available.</div>;

  const {
    workloadScore,
    energyScore,
    burnoutRisk,
    capacityForecast,
    travelLoad,
    contextualSummary,
    recommendations,
  } = summary;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Talent Health & Wellbeing</h1>
        <p className="text-gray-500">AI-powered analysis of workload, energy, and burnout risk.</p>
      </header>

      <BurnoutWarning risk={burnoutRisk} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Workload Score" value={workloadScore.toFixed(0)} />
        <StatCard title="Energy Score" value={energyScore.toFixed(0)} />
        <StatCard title="Travel Load (Hours)" value={travelLoad.toFixed(1)} />
        <StatCard title="Capacity (Next 7 Days)" value={`${capacityForecast.next7days}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">AI Summary</h3>
          <p className="text-sm">{contextualSummary}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">AI Recommendations</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(recommendations || []).map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
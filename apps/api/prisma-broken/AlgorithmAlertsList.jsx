import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AlertCard = ({ alert }) => {
  const impactColor = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    low: 'border-green-500',
  }[alert.impact] || 'border-gray-500';

  return (
    <Link to={`/alerts/algorithm/${alert.id}`} className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg border-l-4 ${impactColor}">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 uppercase">{alert.platform} - {alert.type}</p>
          <h3 className="font-bold text-lg">{alert.title}</h3>
        </div>
        <span className="text-xs text-gray-400">{new Date(alert.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{alert.description}</p>
    </Link>
  );
};

export default function AlgorithmAlertsListPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts/algorithm');
        const data = await res.json();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <div className="p-8">Loading Alerts...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Algorithm Radar™ Alerts</h1>
      {alerts.length === 0 ? (
        <p>No new alerts. Your accounts are looking stable.</p>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
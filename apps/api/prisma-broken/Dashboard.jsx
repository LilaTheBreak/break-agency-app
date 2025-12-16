import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

export default function BrandDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/brand/dashboard');
        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading Dashboard...</div>;
  if (!data) return <div className="p-8">Could not load data.</div>;

  const { user, stats } = data;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <Link to="/brand/campaigns/create" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          + New Campaign
        </Link>
      </div>
      <p className="mb-8">Your subscription: <span className="font-semibold capitalize">{user.subscriptionStatus}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Campaigns" value={stats.campaigns} />
        <StatCard title="Creator Requests Sent" value={stats.requests} />
        <StatCard title="Deliverables Pending" value={stats.deliverables} />
      </div>
    </div>
  );
}
import React from 'react';

const Stat = ({ label, value, color = 'text-gray-900 dark:text-white' }) => (
  <div className="text-center">
    <div className={`text-xl font-bold ${color}`}>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export default function PricingRecommendations({ snapshot }) {
  const { recommended, marketLow, marketHigh, baseRate } = snapshot;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="font-bold mb-4 text-center">Recommended Pricing</h3>
      <div className="flex justify-around items-center">
        <Stat label="Market Low" value={marketLow} color="text-red-500" />
        <Stat label="AI Recommended" value={recommended} color="text-green-500" />
        <Stat label="Market High" value={marketHigh} color="text-blue-500" />
      </div>
      <p className="text-xs text-center mt-3 text-gray-500">
        Base Rate (from model): {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(baseRate)}
      </p>
    </div>
  );
}
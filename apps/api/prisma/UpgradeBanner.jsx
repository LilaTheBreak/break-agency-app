import React, { useState } from 'react';

export default function UpgradeBanner({ plan, featureName }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session.');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert('Could not initiate upgrade. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded-md my-4">
      <div className="flex items-center justify-between">
        <p>
          <span className="font-bold">Upgrade Required:</span> The "{featureName}" feature is available on the Premium plan.
        </p>
        <button onClick={handleUpgrade} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
          {loading ? 'Redirecting...' : 'Upgrade Now'}
        </button>
      </div>
    </div>
  );
}
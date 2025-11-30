import React, { useState } from 'react';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch('/api/billing/brand/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'clxrz45gn000008l4hy285p0g' }), // Mock user ID
    });
    const { url } = await res.json();
    if (url) {
      window.location.href = url;
    } else {
      alert('Could not initiate checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold mb-2">Unlock Premium</h1>
        <p className="text-gray-500 mb-6">Gain full access to our AI suite, entire talent roster, and unlimited campaigns.</p>
        <button onClick={handleUpgrade} disabled={loading} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg">
          {loading ? 'Redirecting...' : 'Upgrade to Premium - £99/month'}
        </button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';

export default function UGCSubscribePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    const res = await fetch('/api/billing/ugc/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'some_ugc_user_id' }), // Mock user ID
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
        <h1 className="text-3xl font-bold mb-2">Join the Marketplace</h1>
        <p className="text-gray-500 mb-6">Subscribe to access the UGC marketplace, apply for opportunities, and connect with brands.</p>
        <button onClick={handleSubscribe} disabled={loading} className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-lg">
          {loading ? 'Redirecting...' : 'Subscribe Now - £19/month'}
        </button>
      </div>
    </div>
  );
}
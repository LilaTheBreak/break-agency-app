import React, { useState } from 'react';

const Feature = ({ children }) => (
  <li className="flex items-center gap-2">
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
    </svg>
    <span>{children}</span>
  </li>
);

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Could not initiate checkout.');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 mb-12">Unlock powerful tools to grow your brand or creator career.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* UGC Pro Plan */}
        <div className="p-8 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
          <h2 className="text-2xl font-bold">UGC Pro</h2>
          <p className="text-3xl font-bold my-4">$29<span className="text-lg font-normal text-gray-500">/mo</span></p>
          <ul className="space-y-2 text-left mb-8 flex-grow">
            <Feature>UGC Marketplace Listing</Feature>
            <Feature>Respond to Brand Requests</Feature>
            <Feature>AI Content Optimizer</Feature>
          </ul>
          <button onClick={() => handleUpgrade('ugc_pro')} disabled={loading} className="w-full mt-auto px-4 py-2 font-semibold text-white bg-purple-600 rounded-md">
            {loading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Brand Premium Plan */}
        <div className="p-8 bg-white rounded-lg shadow-lg border-2 border-blue-500 flex flex-col">
          <h2 className="text-2xl font-bold">Brand Premium</h2>
          <p className="text-3xl font-bold my-4">$99<span className="text-lg font-normal text-gray-500">/mo</span></p>
          <ul className="space-y-2 text-left mb-8 flex-grow">
            <Feature>Unlimited UGC Requests</Feature>
            <Feature>Full Roster Access</Feature>
            <Feature>AI Brief Builder</Feature>
            <Feature>Creator Performance Analytics</Feature>
          </ul>
          <button onClick={() => handleUpgrade('premium')} disabled={loading} className="w-full mt-auto px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
            {loading ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>
    </div>
  );
}
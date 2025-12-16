import React, { useState } from 'react';

export default function BillingPage({ user }) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal');
      if (!res.ok) {
        throw new Error('Failed to create billing portal session.');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert('Could not open billing portal. Please try again.');
      setLoading(false);
    }
  };

  const isSubscribed = user?.subscription_status === 'PREMIUM' || user?.subscription_status === 'UGC_PAID';

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Your Current Plan</h2>
        <p className="capitalize text-lg text-gray-600 dark:text-gray-300 mb-4">
          {user?.subscription_status?.replace('_', ' ') ?? 'Free'}
        </p>

        {isSubscribed ? (
          <div>
            <p className="mb-4">Manage your subscription, view invoices, and update your payment method in the Stripe customer portal.</p>
            <button onClick={handleManageSubscription} disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
              {loading ? 'Redirecting...' : 'Manage Subscription'}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">You are currently on the Free plan. Upgrade to unlock premium features.</p>
            {/* You can reuse the UpgradeBanner or a similar component here */}
            <button onClick={() => alert('Redirect to upgrade page/flow')} className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
              View Upgrade Options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
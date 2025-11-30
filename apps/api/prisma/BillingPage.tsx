import React from 'react';

export default function BillingPage() {
  // In a real app, you'd fetch the user's subscription status and customer ID
  const user = {
    subscription_status: 'premium',
    subscription_plan: 'price_brand_premium',
    subscription_renewal: new Date(Date.now() + 25 * 24 * 3600 * 1000),
    subscription_customerId: 'cus_xxxxxxxxxxxxxx', // Mock customer ID
  };

  const handleManageSubscription = () => {
    // Redirects to the Stripe Billing Portal
    window.location.href = `/api/billing/brand/portal?customerId=${user.subscription_customerId}`;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-lg">
        <h2 className="text-xl font-semibold">Your Plan: {user.subscription_status?.toUpperCase()}</h2>
        <p className="text-sm text-gray-500">Renews on: {user.subscription_renewal.toLocaleDateString()}</p>
        <button onClick={handleManageSubscription} className="mt-4 px-4 py-2 text-sm font-semibold border rounded-md">
          Manage Subscription
        </button>
      </div>
    </div>
  );
}
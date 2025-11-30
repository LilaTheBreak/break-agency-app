import React, { useState, useEffect } from 'react';
import PricingRecommendations from './PricingRecommendations';
import UpsellSuggestions from './UpsellSuggestions';
import PricingScriptsPanel from './PricingScriptsPanel';

async function fetchPricing(dealDraftId) {
  const res = await fetch('/api/pricing/calc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealDraftId }),
  });
  if (!res.ok) return null;
  return res.json();
}

export default function DealPricingSidebar({ dealDraftId }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealDraftId) return;
    setLoading(true);
    fetchPricing(dealDraftId)
      .then(setSnapshot)
      .finally(() => setLoading(false));
  }, [dealDraftId]);

  if (loading) {
    return <div className="p-6 animate-pulse">Calculating price...</div>;
  }

  if (!snapshot) {
    return <div className="p-6">Could not calculate pricing for this deal.</div>;
  }

  return (
    <aside className="w-1/3 p-6 bg-gray-50 dark:bg-gray-900 border-l dark:border-gray-700 space-y-8">
      <header>
        <h2 className="text-2xl font-bold">AI Pricing Engine</h2>
        <p className="text-sm text-gray-500">Dynamic recommendations for this deal.</p>
      </header>

      <PricingRecommendations snapshot={snapshot} />
      <UpsellSuggestions upsells={snapshot.upsells} />
      <PricingScriptsPanel snapshot={snapshot} />
    </aside>
  );
}
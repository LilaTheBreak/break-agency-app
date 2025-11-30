import React, { useState, useEffect } from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${className}`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <div className="mt-1">{children}</div>
  </div>
);

const fetchInsights = async (draftId) => {
  const res = await fetch(`/api/ai/negotiation/${draftId}`);
  if (!res.ok) return null;
  return res.json();
};

export default function InsightPanel({ draftId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!draftId) return;
    setLoading(true);
    fetchInsights(draftId)
      .then(setInsights)
      .finally(() => setLoading(false));
  }, [draftId]);

  if (loading) {
    return <div className="p-6 animate-pulse">Loading negotiation insights...</div>;
  }

  if (!insights) {
    return <div className="p-6">No negotiation insights found for this draft.</div>;
  }

  const { recommendedRange, counterOffers, redFlags, upsellOptions, toneVariants, finalScript } = insights;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-6">
      <h2 className="text-2xl font-bold">AI Negotiation Playbook</h2>

      <InfoCard title="AI Rate Recommendation">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-lg font-bold text-red-500">{new Intl.NumberFormat().format(recommendedRange.min)}</div>
            <div className="text-xs">Minimum</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{new Intl.NumberFormat().format(recommendedRange.ideal)}</div>
            <div className="text-xs font-semibold">Ideal</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-500">{new Intl.NumberFormat().format(recommendedRange.premium)}</div>
            <div className="text-xs">Premium</div>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Counter-Offer Playbook">
        <div className="space-y-4">
          {(counterOffers || []).map((offer, i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <div className="font-bold text-lg">{new Intl.NumberFormat().format(offer.amount)}</div>
              <p className="text-sm">{offer.justification}</p>
              <button className="text-xs text-blue-500 mt-1">Insert Script</button>
            </div>
          ))}
        </div>
      </InfoCard>

      <InfoCard title="Risks & Redlines" className="bg-red-50 dark:bg-red-900/50">
        <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1">
          {(redFlags || []).map((flag, i) => (
            <li key={i}><strong>{flag.issue}</strong> ({flag.severity}): {flag.explanation}</li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard title="Upsell Opportunities">
        <div className="space-y-2">
          {(upsellOptions || []).map((opt, i) => (
            <div key={i} className="flex justify-between items-center">
              <span>{opt.upsellType} (+{new Intl.NumberFormat().format(opt.suggestedPrice)})</span>
              <button className="text-xs px-2 py-1 border rounded-md">Apply to Offer</button>
            </div>
          ))}
        </div>
      </InfoCard>

      <InfoCard title="Final Recommended Script">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm whitespace-pre-wrap">{finalScript}</p>
        </div>
        <div className="mt-4 flex justify-between">
          <div className="flex gap-2">
            {Object.keys(toneVariants || {}).map(tone => (
              <button key={tone} className="text-xs px-2 py-1 border rounded-md capitalize">{tone}</button>
            ))}
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Insert Script & Send</button>
        </div>
      </InfoCard>
    </div>
  );
}
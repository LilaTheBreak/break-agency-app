import React, { useState, useEffect } from 'react';

export default function AutoPlanPanel({ contractReviewId, campaign }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if a plan already exists on the campaign
    if (campaign?.autoPlans?.length > 0) {
      setPlan(campaign.autoPlans[0]);
    }
  }, [campaign]);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch(`/api/campaign/${contractReviewId}/generate-plan`, { method: 'POST' });
    if (res.ok) {
      const newPlan = await res.json();
      setPlan(newPlan);
    } else {
      alert('Failed to generate plan.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">AI Campaign Plan</h3>
      {plan ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600">
            AI has successfully generated a campaign plan.
          </p>
          <div className="flex gap-2">
            <a href={`/campaigns/${campaign.id}/plan`} className="px-3 py-1 text-sm border rounded-md">
              View Plan
            </a>
          </div>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating Plan...' : 'Generate AI Plan'}
        </button>
      )}
    </div>
  );
}
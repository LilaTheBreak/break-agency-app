import React, { useState, useEffect } from 'react';

interface Deliverable {
  type: string;
  platform: string;
  quantity: number;
}

const AIDeliverableCard = ({ deliverable }: { deliverable: Deliverable }) => (
  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <p className="font-bold">{deliverable.quantity}x {deliverable.type}</p>
    <p className="text-xs text-gray-500">{deliverable.platform}</p>
  </div>
);

const AIFeeEstimator = ({ estimate }: { estimate: any }) => (
  <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-lg text-center">
    <p className="text-xs font-bold text-green-800 dark:text-green-200">AI Fee Estimate</p>
    <p className="text-2xl font-bold">£{estimate.min.toLocaleString()} - £{estimate.max.toLocaleString()}</p>
    <p className="text-xs italic text-gray-600 dark:text-gray-400">{estimate.justification}</p>
  </div>
);

export default function AIDeliverablesPanel({ dealDraftId }: { dealDraftId: string }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dealDraftId) return;
    fetch(`/api/deal-drafts/${dealDraftId}/ai-plan`)
      .then(res => res.json())
      .then(setDraft);
  }, [dealDraftId]);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch('/api/deliverables/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealDraftId }),
    });
    if (res.ok) {
      setDraft(await res.json());
    } else {
      alert('Failed to generate plan.');
    }
    setLoading(false);
  };

  if (!draft && !loading) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate AI Deliverable Plan
        </button>
      </div>
    );
  }

  if (loading || !draft.aiDeliverablePlan) {
    return <div className="p-6 text-center">AI is analyzing the brief and generating a plan...</div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI-Generated Campaign Plan</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Inferred Deliverables</h3>
          {(draft.aiDeliverablePlan || []).map((d: Deliverable, i: number) => <AIDeliverableCard key={i} deliverable={d} />)}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Estimated Fees & Timeline</h3>
          {draft.aiFeeEstimate && <AIFeeEstimator estimate={draft.aiFeeEstimate} />}
          {draft.aiTimeline && <p className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded-md">{draft.aiTimeline.summary}</p>}
        </div>
      </div>
    </div>
  );
}
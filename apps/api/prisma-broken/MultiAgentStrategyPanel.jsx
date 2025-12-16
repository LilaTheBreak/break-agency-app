import React, { useState, useEffect } from 'react';

export default function MultiAgentStrategyPanel({ dealDraftId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // This assumes the dealDraft has a negotiationSession attached after it's run
  useEffect(() => {
    // Fetch initial data if it exists
  }, [dealDraftId]);

  const handleRun = async () => {
    setLoading(true);
    const res = await fetch(`/api/negotiation/${dealDraftId}/multi-agent-run`, { method: 'POST' });
    if (res.ok) {
      setSession(await res.json());
    } else {
      alert('Failed to run multi-agent analysis.');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6 text-center">AI panel is debating...</div>;

  if (!session) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleRun} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md">
          Run Multi-Agent Negotiation AI
        </button>
      </div>
    );
  }

  const { aiUnifiedPlan, aiAgentConfidence, aiAlternatives } = session;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Multi-Agent Strategy</h2>
        <div className="text-right">
          <p className="font-bold text-2xl text-purple-500">{aiAgentConfidence}<span className="text-base">%</span></p>
          <p className="text-xs text-gray-500">AI Panel Confidence</p>
        </div>
      </header>

      <div className="p-4 bg-purple-50 dark:bg-purple-900/50 rounded-lg mb-6">
        <h3 className="font-semibold text-purple-800 dark:text-purple-200">Unified Plan: Open at £{aiUnifiedPlan.openingCounter.toLocaleString()}</h3>
        <p className="text-sm mt-1">{aiUnifiedPlan.summary}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Key Talking Points:</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          {(aiUnifiedPlan.keyTalkingPoints || []).map((point, i) => <li key={i}>{point}</li>)}
        </ul>
      </div>
    </div>
  );
}
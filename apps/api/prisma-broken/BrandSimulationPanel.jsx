import React, { useState, useEffect } from 'react';

const Round = ({ round }) => (
  <div className="p-3 border-t dark:border-gray-700">
    <p className="text-xs font-bold text-gray-500">ROUND {round.round}</p>
    <div className="mt-2 text-sm p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md">
      <strong>Our Agent:</strong> {round.ourAgentSays}
    </div>
    <div className="mt-2 text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
      <strong>Simulated Brand:</strong> {round.brandReply}
    </div>
  </div>
);

export default function BrandSimulationPanel({ dealDraftId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // This assumes the dealDraft has a negotiationSession attached
  useEffect(() => {
    // Fetch initial data if it exists
  }, [dealDraftId]);

  const handleRun = async () => {
    setLoading(true);
    const res = await fetch(`/api/negotiation/${dealDraftId}/simulate-brand`, { method: 'POST' });
    if (res.ok) {
      setSession(await res.json());
    } else {
      alert('Failed to run brand simulation.');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-6 text-center">AI is simulating the brand's negotiation style...</div>;

  if (!session?.aiBrandSimulation) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleRun} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md">
          Run Brand Counterparty Simulation
        </button>
      </div>
    );
  }

  const { aiBrandSimulation, aiLikelyMaxFee, aiCloseProbability } = session;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Brand Simulation</h2>
        <div className="text-right">
          <p className="font-bold text-2xl text-red-500">{aiCloseProbability}%</p>
          <p className="text-xs text-gray-500">Predicted Close Probability</p>
        </div>
      </header>

      <div className="p-4 bg-red-50 dark:bg-red-900/50 rounded-lg mb-6">
        <h3 className="font-semibold text-red-800 dark:text-red-200">Simulation Outcome</h3>
        <p className="text-sm mt-1">
          The AI predicts the brand is a <strong>{aiBrandSimulation.brandPersonaAdopted}</strong> negotiator.
          Their likely maximum fee is <strong>£{aiLikelyMaxFee?.toLocaleString()}</strong>.
          The deal is predicted to <strong>{aiBrandSimulation.finalOutcome.dealClosed ? 'close' : 'fail'}</strong> at a final fee of <strong>£{aiBrandSimulation.finalOutcome.finalFee?.toLocaleString()}</strong>.
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Simulated Conversation:</h4>
        <div className="border rounded-md dark:border-gray-700 max-h-96 overflow-y-auto">
          {(aiBrandSimulation.rounds || []).map((round, i) => <Round key={i} round={round} />)}
        </div>
      </div>
    </div>
  );
}
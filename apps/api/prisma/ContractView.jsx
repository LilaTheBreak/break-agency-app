import React, { useState, useEffect } from 'react';

const RiskCard = ({ risk }) => (
  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-md">
    <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">{risk.risk}</p>
    <p className="text-xs">{risk.recommendation}</p>
  </div>
);

export default function ContractView({ dealDraftId }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealDraftId) return;
    // This assumes a 1-to-1 mapping from dealDraftId to a ContractGenerated record.
    // A more robust fetch might be needed.
    const fetchContract = async () => {
      const draft = await (await fetch(`/api/deal-drafts/${dealDraftId}`)).json();
      if (draft.generatedContract) {
        setContract(draft.generatedContract);
      }
      setLoading(false);
    };
    fetchContract();
  }, [dealDraftId]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/contracts/generate/${dealDraftId}`, { method: 'POST' });
    // Poll for results...
  };

  if (loading) return <div className="p-6 text-center">Loading contract...</div>;

  if (!contract) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate AI Contract
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">AI-Generated Contract</h2>
        <a href={contract.pdfUrl} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
          Download PDF
        </a>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">Contract Text</h3>
          <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-100 dark:bg-gray-700 p-4 rounded-md h-96 overflow-y-auto">
            {contract.contractText}
          </pre>
        </div>
        <div className="space-y-4">
          <h3 className="font-bold">AI Risk Analysis</h3>
          {(contract.risksJson || []).map((risk, i) => <RiskCard key={i} risk={risk} />)}
        </div>
      </div>
    </div>
  );
}
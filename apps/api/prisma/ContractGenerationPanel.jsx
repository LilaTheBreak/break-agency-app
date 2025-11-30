import React, { useState, useEffect } from 'react';

export default function ContractGenerationPanel({ thread }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This assumes the generated contract is linked back to the deal draft
    if (thread.dealDraft?.generatedContract) {
      setContract(thread.dealDraft.generatedContract);
    }
  }, [thread]);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch(`/api/contracts/auto-generate/${thread.id}`, { method: 'POST' });
    if (res.ok) {
      const newContract = await res.json();
      setContract(newContract);
    } else {
      alert('Failed to generate contract.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">AI Contract Generation</h3>
      {contract ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600">
            Contract has been generated successfully.
          </p>
          <div className="flex gap-2">
            <a href={`/contracts/${contract.id}/review`} className="px-3 py-1 text-sm border rounded-md">
              View & Review
            </a>
            <a href={contract.fileUrl} className="px-3 py-1 text-sm border rounded-md">
              Download PDF
            </a>
          </div>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating...' : 'Generate AI Contract'}
        </button>
      )}
    </div>
  );
}
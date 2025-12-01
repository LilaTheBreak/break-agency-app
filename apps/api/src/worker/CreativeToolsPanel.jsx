import React, { useState, useEffect } from 'react';

const GeneratedAsset = ({ title, items }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="mb-4">
      <h4 className="font-semibold text-md mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
            <p className="text-sm">{typeof item === 'object' ? item.scene || item.text : item}</p>
            <button onClick={() => copyToClipboard(typeof item === 'object' ? item.scene || item.text : item)} className="text-xs text-gray-500 hover:text-blue-500">Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CreativeToolsPanel({ deliverableId }) {
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/assets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverableId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to start asset generation.');
      }
      alert('Asset generation started! Results will appear here shortly.');
      // In a real app, you would start polling for the AssetGeneration record.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // This would poll for the results in a real app.
  // For now, it's just a placeholder.
  useEffect(() => {
    // fetch(`/api/deliverables/${deliverableId}/assets`).then(...)
  }, [deliverableId]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">AI Creative Tools</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Concepts'}
        </button>
      </div>

      {error && <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}

      {!assets && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Click "Generate Concepts" to get AI-powered creative assets for this deliverable.</p>
        </div>
      )}

      {assets && (
        <div className="space-y-6">
          <GeneratedAsset title="Hooks" items={assets.hooks} />
          <GeneratedAsset title="Short Caption" items={[assets.captions.short]} />
          <GeneratedAsset title="Script Outline" items={assets.scripts.outline} />
          <GeneratedAsset title="Image Prompts" items={assets.imagePrompts} />
        </div>
      )}
    </div>
  );
}
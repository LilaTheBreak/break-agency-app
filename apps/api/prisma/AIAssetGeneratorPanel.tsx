import React, { useState } from 'react';

interface PanelProps {
  deliverableId: string;
}

const OutputDisplay = ({ asset }: { asset: any }) => (
  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <h4 className="font-bold text-sm mb-2">Generated {asset.type}</h4>
    <div className="text-sm whitespace-pre-wrap font-mono">
      {JSON.stringify(asset.aiOutput, null, 2)}
    </div>
    <div className="mt-4 flex gap-2">
      <button className="text-xs px-3 py-1 border rounded-md">Save to Deliverable</button>
      <button className="text-xs px-3 py-1 border rounded-md">Create New Version</button>
    </div>
  </div>
);

export default function AIAssetGeneratorPanel({ deliverableId }: PanelProps) {
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState('script');
  const [tone, setTone] = useState('witty');
  const [generatedAsset, setGeneratedAsset] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedAsset(null);
    const res = await fetch('/api/assets/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverableId,
        type: assetType,
        preferences: { tone, length: 'short' },
      }),
    });

    if (res.ok) {
      setGeneratedAsset(await res.json());
    } else {
      const error = await res.json();
      alert(`Failed to generate asset: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-xl space-y-4">
      <header>
        <h2 className="text-2xl font-bold">AI Creative Asset Generator</h2>
        <p className="text-sm text-gray-500">Instantly generate scripts, hooks, talking points, and more.</p>
      </header>

      <div className="flex items-end gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div>
          <label className="text-xs font-medium">Asset Type</label>
          <select value={assetType} onChange={e => setAssetType(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700">
            <option value="script">Script</option>
            <option value="hooks">Hooks</option>
            <option value="talking_points">Talking Points</option>
            <option value="thumbnail_ideas">Thumbnail Ideas</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Tone</label>
          <select value={tone} onChange={e => setTone(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700">
            <option>Witty</option>
            <option>Professional</option>
            <option>Inspirational</option>
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating...' : '✨ Generate Asset'}
        </button>
      </div>

      {generatedAsset && <OutputDisplay asset={generatedAsset} />}
    </div>
  );
}
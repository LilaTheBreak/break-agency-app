import React, { useState } from 'react';

const OutputDisplay = ({ output }: { output: any }) => (
  <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <h3 className="text-xl font-bold mb-4">AI-Generated Pitch</h3>
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Campaign Concept</h4>
        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">"{output.campaignConcept}"</p>
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Creative Angle</h4>
        <p>{output.creativeAngle}</p>
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-500">Suggested Deliverables</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">{(output.deliverables || []).join(', ')}</p>
      </div>
      <div className="mt-4 pt-4 border-t dark:border-gray-700">
        <h4 className="font-semibold text-sm text-gray-500 mb-2">Pitch Email Body</h4>
        <div className="p-4 bg-white dark:bg-gray-700 rounded-md text-sm whitespace-pre-wrap">
          {output.pitchEmailBody}
        </div>
      </div>
    </div>
  </div>
);

export default function AIPitchGeneratorPanel() {
  const [loading, setLoading] = useState(false);
  const [brandName, setBrandName] = useState('Nike');
  const [pitchType, setPitchType] = useState('cold_outreach');
  const [personaMode, setPersonaMode] = useState('creator_persona');
  const [generatedPitch, setGeneratedPitch] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedPitch(null);
    const res = await fetch('/api/pitches/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandName,
        type: pitchType,
        personaMode,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setGeneratedPitch(data.output);
    } else {
      const error = await res.json();
      alert(`Failed to generate pitch: ${error.message || 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-2xl space-y-6">
      <header>
        <h2 className="text-3xl font-bold">AI Brand Pitch Generator</h2>
        <p className="text-md text-gray-500">Generate compelling campaign pitches in seconds.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="md:col-span-2">
          <label className="text-xs font-medium">Brand Name</label>
          <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700" />
        </div>
        <div>
          <label className="text-xs font-medium">Pitch Type</label>
          <select value={pitchType} onChange={e => setPitchType(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700">
            <option value="cold_outreach">Cold Outreach</option>
            <option value="campaign_expansion">Campaign Expansion</option>
            <option value="new_product_launch">New Product Launch</option>
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating...' : '✨ Generate Pitch'}
        </button>
      </div>

      {generatedPitch && <OutputDisplay output={generatedPitch} />}
    </div>
  );
}
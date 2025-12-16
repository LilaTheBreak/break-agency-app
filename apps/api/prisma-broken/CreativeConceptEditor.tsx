import React, { useState, useEffect } from 'react';

interface EditorProps {
  deliverableId: string;
}

const ConceptBlock = ({ concept }: { concept: any }) => (
  <div className="p-4 border dark:border-gray-700 rounded-lg">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-bold">{concept.conceptName}</h3>
      <p className="text-xl font-bold text-purple-500">{concept.score}/100</p>
    </div>
    <p className="text-sm mb-4">{concept.conceptDescription}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div>
        <h5 className="font-semibold mb-1">Script Outline</h5>
        <ul className="list-disc list-inside space-y-1">
          {(concept.scriptOutline || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
        </ul>
      </div>
      <div>
        <h5 className="font-semibold mb-1">Shot List</h5>
        <ul className="list-disc list-inside space-y-1">
          {(concept.shotList || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    </div>
  </div>
);

export default function CreativeConceptEditor({ deliverableId }: EditorProps) {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('TikTok');
  const [style, setStyle] = useState('Viral Trend');

  useEffect(() => {
    if (!deliverableId) return;
    fetch(`/api/deliverables/${deliverableId}/concepts`)
      .then(res => res.json())
      .then(setConcepts);
  }, [deliverableId]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/deliverables/${deliverableId}/concepts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        options: { style },
      }),
    });
    setTimeout(() => {
      fetch(`/api/deliverables/${deliverableId}/concepts`).then(res => res.json()).then(setConcepts);
      setLoading(false);
    }, 3000); // Poll for results
  };

  const platformConcepts = concepts.filter(c => c.platform === platform);

  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-xl space-y-6">
      <header>
        <h2 className="text-3xl font-bold">AI Creative Concept Generator</h2>
        <p className="text-md text-gray-500">Brainstorm viral concepts, scripts, and shot lists.</p>
      </header>

      <div className="flex items-end gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <label className="text-xs font-medium">Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700">
            <option>TikTok</option>
            <option>Instagram</option>
            <option>YouTube</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Creative Style</label>
          <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700">
            <option>Viral Trend</option>
            <option>Cinematic Story</option>
            <option>Educational Tutorial</option>
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md">
          {loading ? 'AI is Brainstorming...' : 'Generate Concept'}
        </button>
      </div>

      <div className="space-y-4">
        {platformConcepts.map(concept => <ConceptBlock key={concept.id} concept={concept} />)}
        {platformConcepts.length === 0 && <p className="text-sm text-center text-gray-500 py-8">No concepts generated for this platform yet.</p>}
      </div>
    </div>
  );
}
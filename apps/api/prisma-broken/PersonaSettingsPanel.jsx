import React, { useState, useEffect } from 'react';

export default function PersonaSettingsPanel({ talentId }) {
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testText, setTestText] = useState('Hey, just wanted to follow up on our conversation from last week.');
  const [rewrittenText, setRewrittenText] = useState('');

  useEffect(() => {
    if (!talentId) return;
    fetchData();
  }, [talentId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/persona/${talentId}`)
      .then(res => res.json())
      .then(setPersona)
      .finally(() => setLoading(false));
  };

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/persona/${talentId}/generate`, { method: 'POST' });
    setTimeout(fetchData, 5000); // Poll for results
  };

  const handleTestTone = async () => {
    const res = await fetch(`/api/persona/${talentId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText }),
    });
    const data = await res.json();
    setRewrittenText(data.rewrittenText);
  };

  if (loading) return <div className="p-6 text-center">Loading persona...</div>;

  if (!persona) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate AI Persona
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Creator Persona</h2>
        <p className="text-sm text-gray-500">The AI's understanding of this creator's unique voice and style.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold">Tone Keywords</h4>
          <p className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{persona.toneKeywords}</p>
        </div>
        <div>
          <h4 className="font-semibold">Writing Style</h4>
          <p className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{persona.writingStyle}</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Test My Tone</h4>
        <textarea value={testText} onChange={e => setTestText(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700" />
        <button onClick={handleTestTone} className="mt-2 px-3 py-1 text-sm border rounded-md">Rewrite in My Voice</button>
        {rewrittenText && <p className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md text-sm">{rewrittenText}</p>}
      </div>
    </div>
  );
}
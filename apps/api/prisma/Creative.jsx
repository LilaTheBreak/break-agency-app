import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold border-b pb-2 mb-4">{title}</h2>
    {children}
  </div>
);

const ColorSwatch = ({ color, name }) => (
  <div className="text-center">
    <div className="w-16 h-16 rounded-full mx-auto mb-1" style={{ backgroundColor: color }}></div>
    <p className="text-xs font-mono">{color}</p>
    <p className="text-xs text-gray-500 capitalize">{name}</p>
  </div>
);

export default function CreativeDirectionPage() {
  const { id: campaignId } = useParams();
  const [creative, setCreative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCreative = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns/${campaignId}/creative`);
      if (!res.ok) {
        if (res.status === 404) {
          // If not found, try to generate it for the first time
          const genRes = await fetch(`/api/ai/campaign/creative/${campaignId}`, { method: 'POST' });
          if (!genRes.ok) throw new Error('Failed to generate creative direction.');
          const genData = await genRes.json();
          setCreative(genData);
        } else {
          throw new Error('Failed to fetch creative direction.');
        }
      } else {
        const data = await res.json();
        setCreative(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreative();
  }, [campaignId]);

  if (loading) return <div className="p-8">Generating AI Creative Direction...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!creative) return <div className="p-8">No creative direction available.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Creative Direction</h1>
        <div>
          <button onClick={fetchCreative} className="px-4 py-2 mr-2 font-semibold bg-gray-200 rounded-md">Regenerate</button>
          <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Download PDF</button>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <Section title="Campaign Concept">
          <h3 className="font-bold text-lg">{creative.concept.title}</h3>
          <p className="text-gray-600 dark:text-gray-300">{creative.concept.summary}</p>
        </Section>

        <Section title="Tone & Palette">
          <p className="mb-4 text-sm">{creative.tone.description}</p>
          <div className="flex justify-around items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <ColorSwatch color={creative.palette.primary} name="Primary" />
            <ColorSwatch color={creative.palette.secondary} name="Secondary" />
            <ColorSwatch color={creative.palette.accent} name="Accent" />
          </div>
        </Section>

        <Section title="Moodboard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {creative.moodboard.map((url, i) => (
              <img key={i} src={url} alt={`Moodboard image ${i + 1}`} className="w-full h-48 object-cover rounded-lg" />
            ))}
          </div>
        </Section>

        <Section title="Scripts & Hooks">
          <h4 className="font-semibold mb-2">Hooks to Test:</h4>
          <ul className="list-disc list-inside mb-4 text-sm">
            {creative.hooks.map((hook, i) => <li key={i}>{hook}</li>)}
          </ul>
          <h4 className="font-semibold mb-2">Script Outlines:</h4>
          {creative.scripts.map((s, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded mb-2"><p className="text-sm"><strong className="capitalize">{s.platform}:</strong> {s.script}</p></div>
          ))}
        </Section>
      </div>
    </div>
  );
}
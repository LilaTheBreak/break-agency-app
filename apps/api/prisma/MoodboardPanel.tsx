import React, { useState, useEffect } from 'react';

interface PanelProps {
  conceptId: string;
}

const ColorSwatch = ({ color, name }: { color: string; name: string }) => (
  <div className="text-center">
    <div className="w-16 h-16 rounded-full mx-auto mb-1" style={{ backgroundColor: color }}></div>
    <p className="text-xs font-mono">{color}</p>
    <p className="text-xs text-gray-500">{name}</p>
  </div>
);

export default function MoodboardPanel({ conceptId }: PanelProps) {
  const [moodboard, setMoodboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conceptId) return;
    // This assumes you have a way to get the moodboardId from the concept
    // For simplicity, we'll just assume it's fetchable, but a real app might need a different route.
  }, [conceptId]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch('/api/moodboards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId }),
    });
    setTimeout(() => {
      // Poll for results - a real app would use websockets or a more robust polling mechanism
      // For now, we just refetch after a delay.
      setLoading(false);
      alert('Moodboard generation started. It will appear here shortly.');
    }, 3000);
  };

  if (loading) return <div className="p-8 text-center">AI is creating the moodboard...</div>;

  if (!moodboard) {
    return (
      <div className="p-8 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-pink-600 rounded-md">
          Generate AI Moodboard
        </button>
      </div>
    );
  }

  const { fusionAesthetic, referenceImages, colorPalette, typography } = moodboard;

  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-xl space-y-8">
      <header>
        <h2 className="text-3xl font-bold">AI Creative Moodboard</h2>
        <p className="text-md text-gray-500">Visual Direction & Aesthetic</p>
      </header>

      <div className="p-6 bg-pink-50 dark:bg-pink-900/50 rounded-lg">
        <h3 className="font-semibold text-pink-800 dark:text-pink-200 text-xl">{fusionAesthetic.name}</h3>
        <p className="text-sm mt-1">{fusionAesthetic.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-bold mb-2">Reference Imagery</h4>
          <div className="space-y-3">
            {(referenceImages || []).map((img: string, i: number) => (
              <p key={i} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm italic">"{img}"</p>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold">Color Palette & Typography</h4>
          <div className="flex justify-around">
            <ColorSwatch color={colorPalette.primary} name="Primary" />
            <ColorSwatch color={colorPalette.secondary} name="Secondary" />
            <ColorSwatch color={colorPalette.accent} name="Accent" />
          </div>
          <div className="text-center">
            <p className="text-2xl" style={{ fontFamily: typography.headline }}>{typography.headline}</p>
            <p className="text-sm" style={{ fontFamily: typography.body }}>{typography.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
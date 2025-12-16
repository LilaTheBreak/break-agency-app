import React, { useState, useEffect } from 'react';

interface PanelProps {
  conceptId: string;
  platform: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">{title}</h4>
    <div className="text-sm space-y-2">{children}</div>
  </div>
);

const HashtagSet = ({ title, tags }: { title: string; tags: string[] }) => (
  <div>
    <p className="text-xs font-bold">{title}</p>
    <p className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 text-xs break-words">
      {tags.join(' ')}
    </p>
  </div>
);

export default function CaptionsPanel({ conceptId, platform }: PanelProps) {
  const [captions, setCaptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conceptId) return;
    fetch(`/api/concepts/${conceptId}/captions`)
      .then(res => res.json())
      .then(data => setCaptions(data.filter(c => c.platform === platform)));
  }, [conceptId, platform]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/concepts/${conceptId}/captions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    setTimeout(() => {
      fetch(`/api/concepts/${conceptId}/captions`).then(res => res.json()).then(data => setCaptions(data.filter(c => c.platform === platform)));
      setLoading(false);
    }, 3000); // Poll for results
  };

  const latestCaption = captions[0];

  if (loading) return <div className="p-8 text-center">AI is writing captions...</div>;

  if (!latestCaption) {
    return (
      <div className="p-8 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
          Generate AI Captions for {platform}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">AI-Generated Captions for {platform}</h3>
          <p className="text-sm text-gray-500">Primary Caption ({latestCaption.tone})</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-3xl text-green-500">{latestCaption.score}<span className="text-base">/100</span></p>
          <p className="text-xs text-gray-500">Performance Score</p>
        </div>
      </header>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow">
        <p>{latestCaption.primaryCaption}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section title="Variants">
          {(latestCaption.variants || []).map((v: string, i: number) => <p key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md italic">"{v}"</p>)}
        </Section>
        <Section title="Calls to Action">
          {(latestCaption.ctas || []).map((cta: string, i: number) => <p key={i}>- {cta}</p>)}
        </Section>
        <Section title="Hashtags & Sounds">
          <HashtagSet title="Short" tags={latestCaption.hashtags?.short || []} />
          <HashtagSet title="Medium" tags={latestCaption.hashtags?.medium || []} />
          {(latestCaption.soundSuggestions || []).map((s: any, i: number) => <p key={i} className="text-xs mt-2">🎵 {s.name} by {s.artist}</p>)}
        </Section>
      </div>
    </div>
  );
}
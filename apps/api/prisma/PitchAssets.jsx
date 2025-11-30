import React, { useState } from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${className}`}>
    <h3 className="font-bold text-lg mb-3">{title}</h3>
    <div className="text-sm space-y-2">{children}</div>
  </div>
);

const BriefPanel = ({ brief }) => (
  <InfoCard title="AI-Generated Brief">
    <p><strong>Goals:</strong> {brief.campaignGoals?.join(', ')}</p>
    <p><strong>Audience:</strong> {brief.targetAudience}</p>
    <p><strong>Key Message:</strong> {brief.keyMessage}</p>
  </InfoCard>
);

const PitchDeckPanel = ({ pitchDeck }) => (
  <InfoCard title="AI-Generated Pitch Deck">
    <div className="space-y-4">
      {(pitchDeck.slides || []).map((slide, i) => (
        <div key={i} className="p-3 border rounded-md dark:border-gray-700">
          <h4 className="font-semibold">{slide.title}</h4>
          <p>{slide.content}</p>
          <p className="text-xs text-gray-500 mt-1">Visual: {slide.visualSuggestion}</p>
        </div>
      ))}
    </div>
  </InfoCard>
);

const OutreachPanel = ({ outreach }) => (
  <InfoCard title="AI-Generated Outreach Email">
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <p className="font-semibold">Subject: {outreach.subject}</p>
      <p className="mt-2 whitespace-pre-wrap">{outreach.body}</p>
    </div>
  </InfoCard>
);

export default function PitchAssets() {
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // In a real app, brandId and creatorId would come from component props or context
    const res = await fetch('/api/ai/brief/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId: 'brand_123', creatorId: 'user_123' }),
    });
    const data = await res.json();
    setAssets(data);
    setLoading(false);
  };

  return (
    <div className="p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Auto-Pitch Builder</h1>
          <p className="text-gray-500">Generate a complete set of pitch assets for a brand-creator match.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-blue-300"
        >
          {loading ? 'Generating...' : 'Generate All Assets'}
        </button>
      </header>

      {assets ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <BriefPanel brief={assets.brief} />
            <OutreachPanel outreach={assets.outreach} />
          </div>
          <div className="space-y-8">
            <PitchDeckPanel pitchDeck={assets.pitchDeck} />
            {/* Other panels like AutoPlan and Bundle would go here */}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p>{loading ? 'The AI is building your assets...' : 'Click "Generate All Assets" to start.'}</p>
        </div>
      )}
    </div>
  );
}
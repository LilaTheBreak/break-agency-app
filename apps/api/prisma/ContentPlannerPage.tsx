import React, { useState, useEffect } from 'react';

interface PlannerPageProps {
  conceptId: string; // Passed in from the parent component (e.g., a modal)
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm space-y-2">
      {children}
    </div>
  </div>
);

export default function ContentPlannerPage({ conceptId }: PlannerPageProps) {
  const [contentItem, setContentItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // This would fetch the content item associated with the concept
  useEffect(() => {
    // fetch(`/api/content-planner/by-concept/${conceptId}`)...
  }, [conceptId]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch('/api/content-planner/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptId }),
    });
    setTimeout(() => {
      // Poll for results
      setLoading(false);
      alert('Content plan generation started. Refresh in a moment.');
    }, 3000);
  };

  if (loading) return <div className="p-8 text-center">AI is building the content plan...</div>;

  if (!contentItem) {
    return (
      <div className="p-8 text-center">
        <button onClick={handleGenerate} className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg">
          Generate AI Content Plan
        </button>
      </div>
    );
  }

  const latestVersion = contentItem.versions[0];

  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-xl space-y-8">
      <header>
        <h2 className="text-3xl font-bold">{contentItem.title}</h2>
        <p className="text-md text-gray-500">Content Plan for {contentItem.platform}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Section title="AI-Generated Script">
          <p className="whitespace-pre-wrap">{latestVersion.script}</p>
        </Section>
        <Section title="AI Caption Ideas">
          {(latestVersion.aiSuggestions?.captionIdeas || []).map((idea: string, i: number) => <p key={i} className="p-2 bg-white dark:bg-gray-700 rounded-md italic">"{idea}"</p>)}
        </Section>
      </div>
    </div>
  );
}
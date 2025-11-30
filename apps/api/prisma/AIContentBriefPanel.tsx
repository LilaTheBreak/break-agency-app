import React, { useState, useEffect } from 'react';

interface BriefPanelProps {
  deliverableId: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-bold mb-2 text-gray-700 dark:text-gray-300">{title}</h4>
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm space-y-2">
      {children}
    </div>
  </div>
);

const ListItem = ({ item }: { item: string }) => (
  <li className="list-disc list-inside">{item}</li>
);

export default function AIContentBriefPanel({ deliverableId }: BriefPanelProps) {
  const [deliverable, setDeliverable] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetch(`/api/deliverables/${deliverableId}/brief`)
      .then(res => res.json())
      .then(setDeliverable);
  }, [deliverableId]);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch(`/api/deliverables/${deliverableId}/ai-brief`, { method: 'POST' });
    if (res.ok) {
      setDeliverable(await res.json());
    } else {
      alert('Failed to generate AI brief.');
    }
    setLoading(false);
  };

  if (!deliverable && !loading) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md">
          Generate AI Content Brief
        </button>
      </div>
    );
  }

  if (loading || !deliverable.aiContentBrief) {
    return <div className="p-6 text-center">AI is writing the creative brief...</div>;
  }

  const { aiContentBrief, aiScriptOutline, aiShotList, aiHooks, aiCompliance, aiMissingInfo } = deliverable;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI-Generated Content Brief</h2>
        <p className="text-sm text-gray-500">For: {deliverable.type}</p>
      </header>

      <div className="p-4 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
        <h3 className="font-semibold text-purple-800 dark:text-purple-200">Core Concept: {aiContentBrief.concept}</h3>
        <p className="text-sm mt-1"><strong>Key Message:</strong> {aiContentBrief.keyMessage}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Section title="Script Outline">
          <ul>{(aiScriptOutline || []).map((item: string, i: number) => <ListItem key={i} item={item} />)}</ul>
        </Section>
        <Section title="Shot List">
          <ul>{(aiShotList || []).map((item: string, i: number) => <ListItem key={i} item={item} />)}</ul>
        </Section>
        <Section title="Suggested Hooks">
          <ul>{(aiHooks || []).map((item: string, i: number) => <ListItem key={i} item={item} />)}</ul>
        </Section>
      </div>
    </div>
  );
}
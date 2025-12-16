import React, { useState, useEffect } from 'react';

interface ReviewPanelProps {
  deliverableId: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">{title}</h4>
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm space-y-2">
      {children}
    </div>
  </div>
);

const TimestampNote = ({ note }: { note: { timestamp: string; note: string } }) => (
  <div className="flex items-start gap-3">
    <span className="font-mono text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-md">{note.timestamp}</span>
    <p>{note.note}</p>
  </div>
);

export default function AIDraftReviewPanel({ deliverableId }: ReviewPanelProps) {
  const [deliverable, setDeliverable] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetch(`/api/deliverables/${deliverableId}/review`)
      .then(res => res.json())
      .then(setDeliverable);
  }, [deliverableId]);

  const handleReview = async () => {
    setLoading(true);
    const res = await fetch(`/api/deliverables/${deliverableId}/review-draft`, { method: 'POST' });
    if (res.ok) {
      setDeliverable(await res.json());
    } else {
      alert('Failed to run AI draft review.');
    }
    setLoading(false);
  };

  if (!deliverable && !loading) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleReview} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Run AI Draft Review
        </button>
      </div>
    );
  }

  if (loading || !deliverable.aiDraftReview) {
    return <div className="p-6 text-center">AI is reviewing the draft...</div>;
  }

  const {
    aiDraftReview,
    aiTimestampNotes,
    aiSuggestions,
    aiCompliance,
    aiTalentSummary,
  } = deliverable;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Draft Review</h2>
        <div className="text-right">
          <p className="font-bold text-4xl text-blue-500">{aiDraftReview.score}<span className="text-lg">/100</span></p>
          <p className="text-xs text-gray-500">Overall Score</p>
        </div>
      </header>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">Summary for Talent</h3>
        <p className="text-sm mt-1">{aiTalentSummary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Section title="Timestamped Video Notes">
          {(aiTimestampNotes || []).map((note: any, i: number) => <TimestampNote key={i} note={note} />)}
        </Section>
        <Section title="Caption Rewrite Suggestions">
          {(aiSuggestions?.rewrites || []).map((rewrite: string, i: number) => (
            <p key={i} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md italic">"{rewrite}"</p>
          ))}
        </Section>
      </div>
    </div>
  );
}
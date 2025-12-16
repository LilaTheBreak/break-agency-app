import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold border-b pb-2 mb-3">{title}</h2>
    {children}
  </div>
);

export default function BriefGenerated() {
  const { state } = useLocation();
  const { briefId } = useParams();
  const brief = state?.brief;

  // In a real app, you'd fetch the brief by ID if it's not in the location state

  if (!brief) {
    return <div className="p-8">Loading brief...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI-Generated Campaign Brief</h1>
        <div>
          <button className="px-4 py-2 mr-2 font-semibold bg-gray-200 rounded-md">Export PDF</button>
          <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Send to Creators</button>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <Section title="Creative Summary">
          <p>{brief.summary}</p>
        </Section>

        <Section title="Key Messages">
          <ul className="list-disc list-inside">
            {brief.keyMessages.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </Section>

        <Section title="Creative Hooks & Ideas">
          <ul className="list-disc list-inside">
            {brief.creativeHooks.map((hook, i) => <li key={i}>{hook}</li>)}
          </ul>
        </Section>

        <Section title="Deliverable Plan">
          <ul className="list-disc list-inside">
            {brief.deliverables.map((d, i) => <li key={i}>{d.count}x {d.type} - {d.notes}</li>)}
          </ul>
        </Section>

        <Section title="Suggested Creators">
          <div className="flex gap-4">
            {brief.suggestedCreators.map(c => (
              <div key={c.id} className="text-center"><img src={c.avatarUrl} className="w-16 h-16 rounded-full mx-auto" /><p className="text-xs mt-1">{c.name}</p></div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
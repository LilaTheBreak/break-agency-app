import React, { useState, useEffect } from 'react';

const TimelineRow = ({ step }) => {
  const startDate = new Date(step.startDate);
  const endDate = new Date(step.endDate);
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center py-3 border-b dark:border-gray-700">
      <div className="w-1/3 font-semibold">{step.step}</div>
      <div className="w-2/3">
        <div className="bg-blue-500 h-6 rounded text-white text-xs flex items-center justify-center" style={{ width: `${duration * 10}%` }}>
          {duration} days
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default function DeliverableTimelineTab({ deliverableId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliverableId) return;
    setLoading(true);
    fetch(`/api/timeline/${deliverableId}`)
      .then(res => res.json())
      .then(setTimeline)
      .finally(() => setLoading(false));
  }, [deliverableId]);

  const handleRegenerate = async () => {
    setLoading(true);
    await fetch('/api/timeline/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId }),
    });
    // Refetch after regeneration
    fetch(`/api/timeline/${deliverableId}`).then(res => res.json()).then(setTimeline).finally(() => setLoading(false));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI-Generated Timeline</h2>
        <button onClick={handleRegenerate} disabled={loading} className="px-4 py-2 text-sm font-medium border rounded-md">
          {loading ? 'Generating...' : 'Regenerate Timeline'}
        </button>
      </header>
      <div className="space-y-2">
        {loading ? <div>Loading timeline...</div> : timeline.map(step => <TimelineRow key={step.id} step={step} />)}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const TimelineItem = ({ item }) => (
  <div className="relative pl-8 py-2 border-l-2 border-blue-500">
    <div className="absolute -left-2 top-2 w-4 h-4 bg-blue-500 rounded-full"></div>
    <p className="font-semibold">{item.title}</p>
    <p className="text-sm text-gray-500">
      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
    </p>
  </div>
);

export default function CampaignTimeline({ dealId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch the generated timeline data here.
    // For now, it's empty until the user clicks the button.
  }, [dealId]);

  const handleAutoSchedule = async () => {
    setLoading(true);
    await fetch(`/api/deals/${dealId}/schedule/auto`, { method: 'POST' });
    // Poll for results or use websockets
    setTimeout(() => {
      // Mock fetching the result
      setTimeline([
        { id: 1, title: 'Draft for: IG Post', startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
        { id: 2, title: 'Draft for: YT Video', startDate: new Date(Date.now() + 14 * 24 * 3600 * 1000), endDate: new Date(Date.now() + 21 * 24 * 3600 * 1000) },
      ]);
      setLoading(false);
    }, 3000);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Campaign Schedule</h2>
        <div className="flex gap-2">
          <button onClick={handleAutoSchedule} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
            {loading ? 'Scheduling...' : 'Auto-Schedule Campaign'}
          </button>
          <button className="px-4 py-2 text-sm border rounded-md">Sync to Google Calendar</button>
        </div>
      </header>

      {loading && timeline.length === 0 ? (
        <p>AI is generating the optimal schedule...</p>
      ) : timeline.length > 0 ? (
        <div className="space-y-4">
          {timeline.map(item => <TimelineItem key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">The campaign has not been scheduled yet.</p>
        </div>
      )}
    </div>
  );
}
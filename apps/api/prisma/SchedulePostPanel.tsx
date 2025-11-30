import React, { useState, useEffect } from 'react';
import { predictBestTimes } from '../../services/ai/aiPostingOptimizerService'; // Assuming this is now a client-side service call

interface SchedulePanelProps {
  deliverable: any;
  talent: any;
}

const BestTimesCard = ({ times, onSelect }: { times: any[], onSelect: (time: string) => void }) => (
  <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
    <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">AI Recommended Times</h4>
    <div className="space-y-2">
      {times.map((item, i) => (
        <div key={i} onClick={() => onSelect(item.time)} className="p-2 bg-white dark:bg-gray-800 rounded-md cursor-pointer hover:bg-blue-100">
          <p className="font-semibold text-sm">{new Date(item.time).toLocaleString()}</p>
          <p className="text-xs text-gray-500">{item.justification}</p>
        </div>
      ))}
    </div>
  </div>
);

export default function SchedulePostPanel({ deliverable, talent }: SchedulePanelProps) {
  const [loading, setLoading] = useState(false);
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    // Fetch best times when the component loads
    predictBestTimes(deliverable.platform || 'tiktok', talent.id).then(data => setBestTimes(data.bestTimes));
  }, [deliverable, talent]);

  const handleSchedule = async () => {
    if (!scheduledAt) {
      alert('Please select a time to schedule the post.');
      return;
    }
    setLoading(true);
    await fetch('/api/scheduled-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverableId: deliverable.id,
        talentId: talent.id,
        platform: deliverable.platform || 'tiktok',
        caption: deliverable.caption,
        mediaUrl: deliverable.fileUrl,
        scheduledAt,
      }),
    });
    alert('Post scheduled successfully!');
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Schedule Post</h2>
        <p className="text-sm text-gray-500">Use the AI optimizer to pick the best time or schedule manually.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bestTimes.length > 0 && <BestTimesCard times={bestTimes} onSelect={setScheduledAt} />}

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-bold mb-2">Manual Scheduling</h4>
          <input
            type="datetime-local"
            value={scheduledAt.substring(0, 16)} // Format for datetime-local input
            onChange={(e) => setScheduledAt(new Date(e.target.value).toISOString())}
            className="w-full p-2 border rounded-md dark:bg-gray-800"
          />
          <button onClick={handleSchedule} disabled={loading} className="w-full mt-4 px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
            {loading ? 'Scheduling...' : 'Confirm & Schedule Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
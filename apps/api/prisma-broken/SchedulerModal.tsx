import React, { useState, useEffect } from 'react';

interface SchedulerModalProps {
  deliverableId: string;
  userId: string;
  onClose: () => void;
}

export default function SchedulerModal({ deliverableId, userId, onClose }: SchedulerModalProps) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [caption, setCaption] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch AI recommendation
    fetch(`/api/schedule/recommendation/${userId}`)
      .then(res => res.json())
      .then(data => {
        setRecommendation(data);
        // Pre-fill with recommended time
        setScheduledAt(new Date(data.time).toISOString().slice(0, 16));
      });
  }, [userId]);

  const handleSchedule = async () => {
    setLoading(true);
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverableId,
        talentId: userId,
        platform: 'INSTAGRAM', // Should be dynamic
        scheduledAt: new Date(scheduledAt),
        caption,
      }),
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Schedule Post</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Date and Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
            />
            {recommendation && (
              <p className="text-xs text-blue-500 mt-1">✨ AI Rec: {recommendation.reason}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              rows={5}
            />
          </div>
          {/* MediaSelector component would go here */}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-md">Cancel</button>
          <button onClick={handleSchedule} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
            {loading ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
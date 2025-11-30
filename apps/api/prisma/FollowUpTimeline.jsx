import React, { useState, useEffect } from 'react';

export default function FollowUpTimeline({ threadId }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    fetch(`/api/follow-ups/${threadId}`)
      .then(res => res.json())
      .then(setSchedule)
      .finally(() => setLoading(false));
  }, [threadId]);

  const handleCreateSchedule = async () => {
    // Mock data for creation
    const res = await fetch(`/api/follow-ups/${threadId}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_123', talentId: 'talent_123' }),
    });
    const newSchedule = await res.json();
    setSchedule(newSchedule);
  };

  if (loading) return <div className="text-xs p-2">Loading follow-up status...</div>;

  return (
    <div className="p-4 my-4 border-t border-b dark:border-gray-700">
      <h4 className="font-semibold text-sm mb-2">Automated Follow-Up</h4>
      {!schedule ? (
        <button onClick={handleCreateSchedule} className="text-xs px-3 py-1 border rounded-md">
          Enable AI Follow-Ups
        </button>
      ) : (
        <div className="text-sm">
          <p>Status: <span className="font-bold capitalize">{schedule.status}</span></p>
          {schedule.status === 'active' && (
            <p>Next follow-up scheduled for: {new Date(schedule.nextRunAt).toLocaleDateString()}</p>
          )}
          <p className="text-xs text-gray-500">
            {schedule.metadata?.followUpCount || 0} follow-ups sent.
          </p>
        </div>
      )}
    </div>
  );
}
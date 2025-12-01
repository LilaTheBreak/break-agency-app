import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const statusStyles = {
  pending: 'bg-gray-200 text-gray-800',
  in_progress: 'bg-blue-200 text-blue-800',
  done: 'bg-green-200 text-green-800',
  overdue: 'bg-red-200 text-red-800',
};

const TimelineItem = ({ item, isEditable, onComplete }) => {
  const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'done';
  const status = isOverdue ? 'overdue' : item.status;

  return (
    <div className="flex items-center gap-4 p-3 border-b dark:border-gray-700">
      <div className="flex-shrink-0">
        {isEditable ? (
          <input
            type="checkbox"
            checked={item.status === 'done'}
            onChange={() => onComplete(item.id, item.status !== 'done')}
            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
          />
        ) : (
          <div className={`w-5 h-5 rounded-full ${item.status === 'done' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        )}
      </div>
      <div className="flex-grow">
        <p className={`font-semibold ${item.status === 'done' ? 'line-through text-gray-500' : ''}`}>
          {item.title}
        </p>
        <p className="text-xs text-gray-500">
          Due: {new Date(item.dueDate).toLocaleDateString()}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};

export default function CampaignTimelinePage() {
  const { id: campaignId } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  // const { user } = useUser(); // Assume a hook to get user info
  const isPremium = true; // Mock: user?.subscriptionStatus === 'premium';

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/timeline`);
      const data = await res.json();
      setTimeline(data);
    } catch (error) {
      console.error('Failed to fetch timeline', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [campaignId]);

  const handleComplete = async (itemId, isCompleting) => {
    const newStatus = isCompleting ? 'done' : 'pending';
    await fetch(`/api/campaigns/timeline/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTimeline(); // Refresh list
  };

  if (loading) return <div className="p-8">Loading Campaign Timeline...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Campaign Timeline</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {timeline.map(item => (
          <TimelineItem key={item.id} item={item} isEditable={isPremium} onComplete={handleComplete} />
        ))}
      </div>
    </div>
  );
}
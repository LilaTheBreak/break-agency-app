import React, { useState, useEffect } from 'react';
import PostingStatusBadge from './PostingStatusBadge';

interface PostingScheduleTableProps {
  deliverableId: string;
}

export default function PostingScheduleTable({ deliverableId }: PostingScheduleTableProps) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posting/${deliverableId}`);
      if (res.ok) setSchedule(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    await fetch(`/api/posting/generate/${deliverableId}`, { method: 'POST' });
    fetchSchedule();
  };

  useEffect(() => {
    fetchSchedule();
  }, [deliverableId]);

  if (loading) return <div className="p-4">Loading Schedule...</div>;

  if (schedule.length === 0) {
    return (
      <div className="p-4 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Generate AI Posting Plan</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">AI Posting Schedule</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled For</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
          {schedule.map(post => (
            <tr key={post.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{post.platform}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(post.scheduledAt).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <PostingStatusBadge status={post.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const statusStyles = {
  suggested: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  approved: 'bg-purple-100 text-purple-800',
  posted: 'bg-green-100 text-green-800',
  late: 'bg-red-100 text-red-800',
};

const SlotCard = ({ slot, onAction }) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-start gap-4">
    <div className="text-center flex-shrink-0">
      <p className="text-sm font-bold text-red-500">{new Date(slot.scheduledFor).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</p>
      <p className="text-2xl font-bold">{new Date(slot.scheduledFor).getDate()}</p>
      <p className="text-xs text-gray-500">{new Date(slot.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
    </div>
    <div className="flex-grow">
      <div className="flex justify-between">
        <p className="font-semibold">{slot.deliverable.title}</p>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[slot.status]}`}>
          {slot.status}
        </span>
      </div>
      <p className="text-sm text-gray-500">For: {slot.user.name}</p>
      <p className="text-xs mt-2 italic text-gray-400">{slot.aiReasoning?.optimalTime}</p>
    </div>
    <div className="flex-shrink-0 space-x-2">
      {slot.status === 'suggested' && <button onClick={() => onAction(slot.id, 'schedule')} className="text-xs text-blue-600">Schedule</button>}
      {slot.status === 'scheduled' && <button onClick={() => onAction(slot.id, 'approve')} className="text-xs text-purple-600">Approve</button>}
      {slot.status === 'approved' && <button onClick={() => onAction(slot.id, 'post')} className="text-xs text-green-600">Mark Posted</button>}
    </div>
  </div>
);

export default function PostingCalendarPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });

  const fetchSlots = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/calendar/slots?${query}`);
      const data = await res.json();
      setSlots(data);
    } catch (error) {
      console.error('Failed to fetch slots', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [filters]);

  const handleAction = async (slotId, action) => {
    let url = '';
    if (action === 'schedule') url = `/api/calendar/slots/${slotId}/schedule`;
    if (action === 'approve') url = `/api/calendar/slots/${slotId}/approve`;
    if (action === 'post') url = `/api/calendar/slots/${slotId}/mark-posted`;

    if (url) {
      await fetch(url, { method: 'POST' });
      fetchSlots(); // Refresh list
    }
  };

  if (loading) return <div className="p-8">Loading Posting Calendar...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posting Calendar</h1>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="p-2 border rounded-md dark:bg-gray-800"
        >
          <option value="">All Statuses</option>
          <option value="suggested">Suggested</option>
          <option value="scheduled">Scheduled</option>
          <option value="approved">Approved</option>
          <option value="posted">Posted</option>
        </select>
      </div>
      <div className="space-y-4">
        {slots.length > 0 ? (
          slots.map(slot => <SlotCard key={slot.id} slot={slot} onAction={handleAction} />)
        ) : (
          <p>No posting slots found for the selected filters.</p>
        )}
      </div>
    </div>
  );
}
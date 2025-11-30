import React, { useState, useEffect } from 'react';
import CalendarEventCard from '../components/calendar/CalendarEventCard';

async function fetchEvents() {
  const res = await fetch('/api/calendar/events');
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Calendar</h1>
        <p className="text-gray-500">Your upcoming events and AI insights.</p>
      </header>

      {loading ? (
        <div>Loading events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <CalendarEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* AI Weekly Summary Panel would go here */}
    </div>
  );
}
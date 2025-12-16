import React from 'react';

const ClashIndicator = () => (
  <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
    CLASH
  </span>
);

const TravelChip = ({ minutes }) => (
  <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
    ~{minutes} min travel
  </span>
);

export default function CalendarEventCard({ event }) {
  const { title, description, startTime, endTime, location, clashDetected, travelTimeMinutes } = event;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
        {clashDetected && <ClashIndicator />}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
      <div className="mt-4 text-sm space-y-1">
        <p><strong>Time:</strong> {new Date(startTime).toLocaleTimeString()} - {new Date(endTime).toLocaleTimeString()}</p>
        <p><strong>Date:</strong> {new Date(startTime).toLocaleDateString()}</p>
        <p><strong>Location:</strong> {location || 'N/A'}</p>
      </div>
      <div className="mt-4 flex justify-between items-center">
        {travelTimeMinutes && <TravelChip minutes={travelTimeMinutes} />}
        <div className="flex gap-2">
          <button className="text-xs px-3 py-1 border rounded-md">Decline</button>
          <button className="text-xs px-3 py-1 text-white bg-green-600 rounded-md">Accept</button>
        </div>
      </div>
    </div>
  );
}
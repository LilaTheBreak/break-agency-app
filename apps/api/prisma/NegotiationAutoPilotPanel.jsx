import React, { useState } from 'react';

export default function NegotiationAutoPilotPanel({ thread }) {
  const [isAuto, setIsAuto] = useState(thread.isAuto || false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const action = isAuto ? 'stop' : 'start';
    await fetch(`/api/negotiation/thread/${thread.id}/autopilot/${action}`, { method: 'POST' });
    setIsAuto(!isAuto);
    setLoading(false);
  };

  const lastAction = thread.lastAiAction;

  return (
    <div className="p-4 border-t dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Negotiation Auto-Pilot</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${isAuto ? 'text-green-500' : 'text-red-500'}`}>
            {isAuto ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-3 py-1 text-xs rounded-md ${isAuto ? 'bg-red-500' : 'bg-green-500'} text-white`}
          >
            {loading ? '...' : isAuto ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
      {lastAction && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <p>
            <strong>Last AI Action:</strong> {lastAction.decision} at {new Date(lastAction.at).toLocaleTimeString()}
          </p>
        </div>
      )}
      {!isAuto && (
        <p className="mt-2 text-xs text-gray-500">
          Activate the auto-pilot to allow the AI to respond to brand emails automatically.
        </p>
      )}
    </div>
  );
}
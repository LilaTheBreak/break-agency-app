import React from 'react';

export default function UpsellSuggestions({ upsells }) {
  if (!upsells || upsells.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="font-bold mb-2">Upsell Opportunities</h3>
      <div className="space-y-2">
        {(upsells || []).map((upsell, i) => (
          <div key={i} className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">{upsell.type}</p>
              <p className="text-xs">{upsell.description}</p>
            </div>
            <button className="text-xs px-2 py-1 border rounded-md">Add to Deal</button>
          </div>
        ))}
      </div>
    </div>
  );
}
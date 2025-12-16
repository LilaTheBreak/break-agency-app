import React, { useState, useEffect } from 'react';

const SuggestionCard = ({ suggestion }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <div className="flex justify-between items-center">
      <h4 className="font-bold">{suggestion.lead.brandName}</h4>
      <span className="text-xs font-medium">Confidence: {(suggestion.confidence * 100).toFixed(0)}%</span>
    </div>
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <p className="text-sm font-semibold">{suggestion.subject}</p>
      <p className="text-sm mt-1 truncate">{suggestion.body}</p>
    </div>
    <div className="mt-3 flex gap-2">
      <button className="text-xs px-3 py-1 border rounded-md">View & Edit</button>
      <button className="text-xs px-3 py-1 text-white bg-green-600 rounded-md">Approve & Send</button>
    </div>
  </div>
);

export default function OutreachPlannerPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const MOCK_USER_ID = 'clxrz45gn000008l4hy285p0g';

  useEffect(() => {
    setLoading(true);
    // In a real app, you'd fetch suggestions for a specific user/sequence.
    // This is a simplified fetch for all pending suggestions.
    prisma.outreachSuggestion.findMany({
      where: { userId: MOCK_USER_ID, status: 'pending' },
      include: { lead: true },
    })
      .then(setSuggestions)
      .finally(() => setLoading(false));
  }, [MOCK_USER_ID]);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">AI Outreach Planner</h1>
          <p className="text-gray-500">Review and manage AI-generated outreach campaigns.</p>
        </div>
        <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Find New Leads
        </button>
      </header>

      {loading ? (
        <p>Loading outreach suggestions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.length > 0 ? (
            suggestions.map(s => <SuggestionCard key={s.id} suggestion={s} />)
          ) : (
            <p className="col-span-full text-center text-gray-500">No new outreach suggestions.</p>
          )}
        </div>
      )}
    </div>
  );
}
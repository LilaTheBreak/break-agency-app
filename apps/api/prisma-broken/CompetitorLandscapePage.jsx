import React, { useState, useEffect } from 'react';

const CompetitorCard = ({ profile }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="font-bold text-lg">{profile.username}</h3>
    <p className="text-sm text-gray-500">{profile.platform}</p>
    <div className="mt-4">
      <h4 className="font-semibold text-xs mb-1">AI Insights:</h4>
      <ul className="list-disc list-inside text-xs space-y-1">
        {(profile.metadata?.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  </div>
);

export default function CompetitorLandscapePage() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const MOCK_USER_ID = 'clxrz45gn000008l4hy285p0g';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/competitors/${MOCK_USER_ID}`)
      .then(res => res.json())
      .then(setCompetitors)
      .finally(() => setLoading(false));
  }, [MOCK_USER_ID]);

  const handleDiscover = async () => {
    await fetch('/api/competitors/discover', { method: 'POST' });
    alert('Discovery process started! Check back in a few minutes.');
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Competitor Landscape</h1>
          <p className="text-gray-500">AI-powered analysis of your talent's competitive environment.</p>
        </div>
        <button onClick={handleDiscover} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Discover Competitors
        </button>
      </header>

      {loading ? (
        <p>Loading competitor data...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.length > 0 ? (
            competitors.map(profile => <CompetitorCard key={profile.id} profile={profile} />)
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No competitors found. Click "Discover Competitors" to start the AI analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
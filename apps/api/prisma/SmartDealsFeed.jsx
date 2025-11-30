import React, { useState, useEffect } from 'react';

const BrandTile = ({ match }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-transform hover:scale-105">
    <div className="flex justify-between items-start">
      <h3 className="font-bold text-lg">{match.brandName}</h3>
      <span className="px-2 py-1 text-xs font-bold text-white bg-green-500 rounded-full">
        {match.fitScore.toFixed(0)} Fit
      </span>
    </div>
    <div className="text-sm text-gray-500 mt-2 space-y-1">
      <p>Est. Fee: <span className="font-semibold">£{match.predictedFee}</span></p>
      <p>Close Prob: <span className="font-semibold">{(match.closeProbability * 100).toFixed(0)}%</span></p>
    </div>
    <div className="mt-3 text-xs">
      <h4 className="font-semibold">Reasons:</h4>
      <ul className="list-disc list-inside">
        {(match.reasons || []).map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
    <div className="mt-4 flex gap-2">
      <button className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md">Auto-Outreach</button>
      <button className="flex-1 px-3 py-1.5 text-xs font-medium border rounded-md">Add to Sequence</button>
    </div>
  </div>
);

async function fetchTopMatches() {
  const res = await fetch('/api/brand-matching/top');
  if (!res.ok) return [];
  return res.json();
}

export default function SmartDealsFeed() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Smart Deals Feed</h2>
          <p className="text-sm text-gray-500">AI-powered sponsorship opportunities for your talent.</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium border rounded-md">Refresh Feed</button>
      </header>

      {loading ? (
        <div>Loading opportunities...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matches.map(match => (
            <BrandTile key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
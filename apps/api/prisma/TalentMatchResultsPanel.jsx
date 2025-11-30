import React, { useState, useEffect } from 'react';

const TalentCard = ({ match }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-2 border-transparent hover:border-blue-500 transition-all">
    <div className="flex items-start gap-4">
      <img src={match.talent.user.avatarUrl || '/default-avatar.png'} alt={match.talent.user.name} className="w-16 h-16 rounded-full object-cover" />
      <div>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{match.talent.user.name}</h3>
          <span className="px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full">
            {match.fitScore}/100 Fit
          </span>
        </div>
        <p className="text-xs text-gray-500">Rank #{match.rank}</p>
        <div className="text-sm mt-2">
          <p>Est. Fee: <span className="font-semibold">£{match.predictedFee}</span></p>
          <p>Est. Reach: <span className="font-semibold">{match.predictedKPIs.predictedReach?.toLocaleString()}</span></p>
        </div>
      </div>
    </div>
    <div className="mt-3 text-xs">
      <h4 className="font-semibold">AI Reasoning:</h4>
      <p className="text-gray-600 dark:text-gray-400">{(match.reasoning || [])[0]}</p>
    </div>
    <div className="mt-4 flex">
      <button className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md">Add to Deck</button>
    </div>
  </div>
);

export default function TalentMatchResultsPanel({ aiPlanId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aiPlanId) return;
    setLoading(true);
    // Use polling to wait for results after plan creation
    const interval = setInterval(() => {
      fetch(`/api/campaign/${aiPlanId}/matches`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setMatches(data);
            setLoading(false);
            clearInterval(interval);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [aiPlanId]);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">AI Talent Shortlist</h2>
        <p className="text-sm text-gray-500">The best creators for this campaign, scored and ranked by AI.</p>
      </header>

      {loading ? (
        <p>AI is analyzing and scoring talent...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {matches.map(match => <TalentCard key={match.id} match={match} />)}
        </div>
      )}
    </div>
  );
}
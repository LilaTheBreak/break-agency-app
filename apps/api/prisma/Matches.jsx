import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const MatchCard = ({ match }) => {
  const isBlurred = match.reasoning?.blurred;

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${match.fitScore > 85 ? 'border-green-500' : 'border-blue-500'}`}>
      <div className="flex items-start gap-4">
        <img src={match.user.avatarUrl} alt={match.user.name} className="w-16 h-16 rounded-full" />
        <div className="flex-grow">
          <div className="flex justify-between">
            <h3 className="font-bold text-lg">{match.user.name}</h3>
            <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
              {match.fitScore}% Fit
            </span>
          </div>
          <p className="text-xs text-gray-500 capitalize">{match.user.roster_category}</p>
        </div>
      </div>
      <div className={`mt-4 border-t pt-4 ${isBlurred ? 'blur-sm select-none' : ''}`}>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="font-semibold">Predicted Fee</p>
            <p>{isBlurred ? '$???' : `$${match.predictedFee}`}</p>
          </div>
          <div>
            <p className="font-semibold">Predicted Views</p>
            <p>{isBlurred ? '???,???' : `${(match.predictedViews / 1000).toFixed(1)}k`}</p>
          </div>
          <div>
            <p className="font-semibold">Predicted ER</p>
            <p>{isBlurred ? '?.?%' : `${match.predictedEngagement}%`}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold">Reasoning:</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {isBlurred ? match.reasoning.blurred : match.reasoning.niche}
          </p>
        </div>
      </div>
      <div className="mt-4 text-right">
        <Link to={`/brand/talent/${match.user.id}/request`} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          Request Talent
        </Link>
      </div>
    </div>
  );
};

export default function BriefMatchesPage() {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // This endpoint needs to exist and be admin-protected
        const res = await fetch(`/api/brand/briefs/${id}/matches`);
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error('Failed to fetch matches', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [id]);

  if (loading) return <div className="p-8">Finding Creator Matches...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">AI Creator Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.length > 0 ? (
          matches.map(match => <MatchCard key={match.id} match={match} />)
        ) : (
          <p>No suitable matches found for this brief. Try broadening your criteria.</p>
        )}
      </div>
    </div>
  );
}
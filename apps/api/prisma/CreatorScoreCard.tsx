import React from 'react';

interface ScoreCardProps {
  user: any; // The full user object
  score: any; // The CreatorScore object
}

const getStars = (score: number) => {
  const rank = Math.round(score / 20); // 5 stars max
  return '★'.repeat(rank) + '☆'.repeat(5 - rank);
};

export default function CreatorScoreCard({ user, score }: ScoreCardProps) {
  if (!score) {
    return <div className="p-4 text-center">Your score is being calculated...</div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
      <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Creator Rank</h3>
      <p className="text-4xl my-2">{getStars(score.overallScore)}</p>
      <p className="text-5xl font-bold">{score.overallScore}<span className="text-2xl text-gray-400">/100</span></p>
      <p className="mt-1 text-sm font-semibold text-blue-500">
        You are classified as: {user.roster_category?.toUpperCase()}
      </p>

      <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
        <p>{score.summary}</p>
      </div>

      {user.upgrade_suggested && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
          <h4 className="font-bold text-green-800 dark:text-green-200">Unlock Your Potential!</h4>
          <p className="text-xs mt-1">
            You're close to unlocking more features. Let's work together to improve your score.
          </p>
          <button className="mt-2 text-xs font-semibold bg-green-600 text-white px-3 py-1 rounded-full">
            Book a Call to Improve Your Score
          </button>
        </div>
      )}
    </div>
  );
}
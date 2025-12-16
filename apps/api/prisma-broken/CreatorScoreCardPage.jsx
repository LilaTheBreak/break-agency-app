import React, { useState, useEffect } from 'react';
// Assuming you have a charting library like 'recharts' installed
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const ScoreTile = ({ label, score }) => (
  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
    <p className="text-3xl font-bold">{score?.toFixed(0)}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default function CreatorScoreCardPage({ talentId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!talentId) return;
    setLoading(true);
    fetch(`/api/creators/${talentId}/score`)
      .then(res => res.json())
      .then(setScore)
      .finally(() => setLoading(false));
  }, [talentId]);

  if (loading) return <div className="p-8 text-center">Loading Creator Scorecard...</div>;
  if (!score) return <div className="p-8 text-center">No score data available for this creator.</div>;

  const {
    overallScore,
    marketFitScore,
    predictedEarningsScore,
    alignmentScore,
    velocityScore,
    portfolioScore,
    summary,
    recommendations,
  } = score;

  const radarData = [
    { subject: 'Market Fit', A: marketFitScore, fullMark: 100 },
    { subject: 'Earnings', A: predictedEarningsScore, fullMark: 100 },
    { subject: 'Alignment', A: alignmentScore, fullMark: 100 },
    { subject: 'Velocity', A: velocityScore, fullMark: 100 },
    { subject: 'Portfolio', A: portfolioScore, fullMark: 100 },
  ];

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">AI Creator Scorecard</h1>
        <div className="text-right">
          <p className="font-bold text-5xl text-blue-500">{overallScore?.toFixed(0)}<span className="text-2xl">/100</span></p>
          <p className="text-sm text-gray-500">Overall Score</p>
        </div>
      </header>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">AI Summary</h3>
        <p className="text-sm mt-1">{summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">AI Recommendations</h3>
          <ul className="list-disc list-inside text-sm space-y-2">
            {(recommendations || []).map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
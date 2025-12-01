import React from 'react';

const Metric = ({ label, value }) => (
  <div className="text-center">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export default function PredictionBreakdown({ prediction }) {
  if (!prediction) return null;

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num;
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      <Metric label="Predicted Views" value={formatNumber(prediction.predictedViews)} />
      <Metric label="Predicted Likes" value={formatNumber(prediction.predictedLikes)} />
      <Metric label="Virality Score" value={`${(prediction.viralityScore * 100).toFixed(0)}%`} />
    </div>
  );
}
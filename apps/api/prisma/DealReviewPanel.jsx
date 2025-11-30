import React, { useState, useEffect } from 'react';

const ScoreGauge = ({ label, score }) => {
  const getRiskColor = (s) => {
    if (s < 60) return 'text-red-500';
    if (s < 85) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="text-center">
      <p className={`text-3xl font-bold ${getRiskColor(score)}`}>{score?.toFixed(0) || 'N/A'}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
};

export default function DealReviewPanel({ dealThreadId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dealThreadId) return;
    fetchData();
  }, [dealThreadId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/compliance/${dealThreadId}`)
      .then(res => res.json())
      .then(setReport)
      .finally(() => setLoading(false));
  };

  const handleReview = async () => {
    // This would need the draftId, which should be available in the parent component
    // For now, we'll assume it's passed or available.
    // await fetch(`/api/deals/${draftId}/review`, { method: 'POST' });
    alert('Review process started. Please check back in a moment.');
  };

  if (loading && !report) return <div className="p-6 text-center">Loading AI review...</div>;

  if (!report) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleReview} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Run Full AI Deal Review
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="mb-4">
        <h2 className="text-xl font-bold">AI Deal Review Engine</h2>
      </header>

      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <ScoreGauge label="Overall Risk" score={report.overallRiskScore} />
        <ScoreGauge label="Brand Safety" score={report.brandSafetyScore} />
        <ScoreGauge label="Negotiation" score={report.negotiationRiskScore} />
        <ScoreGauge label="Contract" score={report.contractRiskScore} />
      </div>
    </div>
  );
}
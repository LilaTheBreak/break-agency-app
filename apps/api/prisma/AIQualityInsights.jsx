import React, { useState, useEffect } from 'react';

const ScoreCircle = ({ label, score }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center">
      <span className="text-2xl font-bold">{score?.toFixed(0)}</span>
    </div>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

export default function AIQualityInsights({ deliverableId }) {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetchData();
  }, [deliverableId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/content/${deliverableId}/quality`)
      .then(res => res.json())
      .then(setQuality)
      .finally(() => setLoading(false));
  };

  const handleAnalyse = async () => {
    setLoading(true);
    await fetch(`/api/content/${deliverableId}/analyse`, { method: 'POST' });
    // Poll for results
    setTimeout(fetchData, 3000);
  };

  if (loading && !quality) return <div className="p-6 text-center">Loading AI analysis...</div>;

  if (!quality) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleAnalyse} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Analyzing...' : 'Run AI Quality Analysis'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Content Quality Insights</h2>
        <button onClick={handleAnalyse} disabled={loading} className="text-sm px-3 py-1 border rounded-md">
          {loading ? 'Analyzing...' : 'Re-run Analysis'}
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ScoreCircle label="Overall" score={quality.overallScore} />
        <ScoreCircle label="Virality" score={quality.viralityScore} />
        <ScoreCircle label="Brand Fit" score={quality.brandFitScore} />
        <ScoreCircle label="Clarity" score={quality.clarityScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">AI Suggestions</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(quality.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Alternative Hooks</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {(quality.hookSuggestions || []).map((h, i) => <li key={i}>{h.hookText}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const ClauseCard = ({ clause }) => {
  const riskColor = clause.riskScore > 0.7 ? 'border-red-500' : clause.riskScore > 0.4 ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600';

  return (
    <div className={`p-4 border-l-4 ${riskColor} bg-white dark:bg-gray-800 rounded-r-lg shadow-sm`}>
      <p className="text-sm font-mono text-gray-500">CLAUSE {clause.clauseIndex + 1} - {clause.category}</p>
      <p className="mt-2 text-sm">{clause.clauseText}</p>

      {clause.alignmentIssues.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-md">
          <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 text-xs">Alignment Issue</h5>
          <p className="text-sm"><strong>{clause.alignmentIssues[0].issue}:</strong> Found "{clause.alignmentIssues[0].found}" but expected "{clause.alignmentIssues[0].expected}".</p>
        </div>
      )}

      {clause.redlineSuggestions.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/50 rounded-md">
          <h5 className="font-semibold text-green-800 dark:text-green-200 text-xs">AI Redline Suggestion</h5>
          <p className="text-sm font-medium">{clause.redlineSuggestions[0].suggestedText}</p>
          <p className="text-xs mt-1"><strong>Reason:</strong> {clause.redlineSuggestions[0].reasoning}</p>
          <button className="text-xs mt-2 font-semibold text-blue-600">Accept Suggestion</button>
        </div>
      )}
    </div>
  );
};

export default function ContractReviewPanel({ contractReviewId }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contractReviewId) return;
    fetchData();
  }, [contractReviewId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/contracts/${contractReviewId}`) // Assuming this route exists now
      .then(res => res.json())
      .then(setReview)
      .finally(() => setLoading(false));
  };

  const handleAnalyse = async () => {
    setLoading(true);
    await fetch('/api/contracts/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractReviewId }),
    });
    // Poll for results
    setTimeout(fetchData, 5000); // Allow more time for full analysis
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">AI Contract Review</h1>
          <p className="text-gray-500">Clause-by-clause analysis, risk assessment, and redline suggestions.</p>
        </div>
        <button onClick={handleAnalyse} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Analyzing...' : 'Run Full AI Review'}
        </button>
      </header>

      {loading && !review ? (
        <p>Loading contract analysis...</p>
      ) : review?.clauses ? (
        <div className="space-y-6">
          {review.clauses.map(clause => (
            <ClauseCard key={clause.id} clause={clause} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No analysis found for this contract.</p>
          <button onClick={handleAnalyse} className="mt-4 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
            Start AI Review
          </button>
        </div>
      )}
    </div>
  );
}
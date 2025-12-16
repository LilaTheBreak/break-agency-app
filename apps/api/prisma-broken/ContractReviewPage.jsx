import React, { useState, useEffect } from 'react';

const RiskItem = ({ item }) => (
  <div className="p-3 bg-red-50 dark:bg-red-900/50 rounded-md">
    <p className="font-semibold text-red-800 dark:text-red-200 text-sm">{item.clause}</p>
    <p className="text-xs">{item.reasoning}</p>
  </div>
);

const MissingTermItem = ({ term }) => (
  <li className="text-sm text-yellow-700 dark:text-yellow-300">{term}</li>
);

const RedlineItem = ({ redline }) => (
  <div className="p-3 border-t dark:border-gray-700">
    <p className="text-xs font-semibold text-gray-500">Original Clause: {redline.clause}</p>
    <p className="text-sm mt-1 p-2 bg-red-100 dark:bg-red-900/50 rounded-md line-through">{redline.originalClause}</p>
    <p className="text-sm mt-2 p-2 bg-green-100 dark:bg-green-900/50 rounded-md">{redline.suggestedRedline}</p>
  </div>
);

export default function ContractReviewPage({ contractReviewId }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contractReviewId) return;
    fetchData();
  }, [contractReviewId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/contract/${contractReviewId}`)
      .then(res => res.json())
      .then(setReview)
      .finally(() => setLoading(false));
  };

  const handleReview = async () => {
    setLoading(true);
    await fetch('/api/contract/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractReviewId }) });
    setTimeout(fetchData, 5000); // Poll for results
  };

  if (loading && !review) return <div className="p-8 text-center">Loading AI review...</div>;

  if (!review || review.status !== 'ai_reviewed') {
    return (
      <div className="p-8 text-center">
        <button onClick={handleReview} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Analyzing...' : 'Run AI Contract Review'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">AI Contract Review & Redline</h1>
        <p className="text-gray-500">Overall Risk Level: <span className="font-bold text-xl">{review.aiRiskLevel}/100</span></p>
      </header>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">Plain English Summary</h3>
        <p className="text-sm mt-1">{review.aiSummary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Risks & Missing Terms</h3>
          <div className="space-y-3">
            {(review.aiRedlineSuggestions || []).map((r, i) => <RiskItem key={i} item={r} />)}
            {(review.aiMissingTerms || []).map((t, i) => <MissingTermItem key={i} term={t} />)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Redline Suggestions</h3>
          <div className="space-y-4">
            {(review.aiRedlineSuggestions || []).map((r, i) => <RedlineItem key={i} redline={r} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
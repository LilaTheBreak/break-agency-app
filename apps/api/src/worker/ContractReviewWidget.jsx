import React, { useState, useEffect } from 'react';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
      active
        ? 'border-b-2 border-blue-500 text-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

const RiskItem = ({ item }) => (
    <div className="p-3 border-l-4 border-red-500 bg-red-50 mb-2">
        <p className="font-semibold">{item.clause}</p>
        <p className="text-sm">{item.description}</p>
    </div>
);

export default function ContractReviewWidget({ reviewId }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('risks');

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/contracts/review/${reviewId}`);
        const data = await res.json();
        setReview(data);
        if (data.status !== 'queued' && data.status !== 'processing') {
          // Stop polling if complete
        }
      } catch (error) {
        console.error('Failed to fetch review', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
    // In a real app, you'd poll this endpoint until status is 'completed' or 'failed'
  }, [reviewId]);

  if (loading || !review || review.status !== 'completed') {
    return <div className="p-4 bg-gray-100 rounded-lg">AI analysis in progress... Status: {review?.status || 'loading'}</div>;
  }

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-lg">
      <div className="border-b flex flex-wrap">
        <TabButton active={activeTab === 'risks'} onClick={() => setActiveTab('risks')}>Risks</TabButton>
        <TabButton active={activeTab === 'missing'} onClick={() => setActiveTab('missing')}>Missing Clauses</TabButton>
        <TabButton active={activeTab === 'redlines'} onClick={() => setActiveTab('redlines')}>Redlines</TabButton>
        <TabButton active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')}>Drafts</TabButton>
      </div>

      <div className="p-4">
        {activeTab === 'risks' && (
          <div>
            <h3 className="font-semibold mb-2">Detected Risks</h3>
            <div className="space-y-2">
              {review.risks?.map((risk, i) => <RiskItem key={i} item={risk} />)}
            </div>
          </div>
        )}

        {activeTab === 'missing' && (
          <div>
            <h3 className="font-semibold mb-2">Potentially Missing Clauses</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {review.missingClauses?.map((clause, i) => <li key={i}>{clause}</li>)}
            </ul>
          </div>
        )}

        {/* Add content for 'redlines' and 'drafts' tabs */}
      </div>
    </div>
  );
}
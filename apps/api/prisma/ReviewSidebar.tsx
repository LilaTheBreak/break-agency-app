import React, { useState, useEffect } from 'react';
import CommentThread from './CommentThread';
import ApprovalActions from './ApprovalActions';

export default function ReviewSidebar({ assetId, assetType }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/creative-review/${assetId}`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      fetchReviews();
    }
  }, [assetId]);

  const handleSubmitForReview = async () => {
    const latestVersion = 1; // In a real app, get this from the asset
    await fetch('/api/creative-review/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, assetType, version: latestVersion }),
    });
    fetchReviews();
  };

  if (loading) return <div className="p-4">Loading review...</div>;

  const latestReview = reviews[0];

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <h3 className="font-semibold mb-4">Creative Review</h3>

      {!latestReview && (
        <button onClick={handleSubmitForReview} className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          Submit for Review
        </button>
      )}

      {latestReview && (
        <>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">AI Summary (v{latestReview.version})</p>
            <p className="text-xs mt-1">{latestReview.aiSummary}</p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4">
            {latestReview.comments.map(comment => (
              <CommentThread key={comment.id} comment={comment} onUpdate={fetchReviews} />
            ))}
          </div>

          <div className="mt-4">
            <ApprovalActions review={latestReview} onUpdate={fetchReviews} />
          </div>
        </>
      )}
    </div>
  );
}
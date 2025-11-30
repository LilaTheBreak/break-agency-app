import React, { useState, useEffect } from 'react';

const ReviewCard = ({ user, onAction }) => {
  const [overrideRole, setOverrideRole] = useState(user.role_recommended || 'TALENT');

  const handleApprove = async () => {
    if (!confirm(`Approve ${user.name} with role ${user.role_recommended}?`)) return;
    onAction(user.id, 'approve', { final_role: user.role_recommended });
  };

  const handleOverride = async () => {
    const notes = prompt(`Enter reason for overriding role for ${user.name} to ${overrideRole}:`);
    if (notes === null) return; // User cancelled
    onAction(user.id, 'override', { new_role: overrideRole, notes });
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span className="px-3 py-1 inline-flex text-lg font-semibold leading-5 rounded-full bg-blue-100 text-blue-800">
            {user.creator_score}
          </span>
        </div>
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-semibold">AI Recommendation:</p>
          <p>Role: <span className="font-bold">{user.role_recommended || 'N/A'}</span></p>
          <p className="text-xs mt-2 text-gray-500">
            Reasoning: {user.creator_score_reason?.notes || 'No specific notes.'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button onClick={handleApprove} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md">
          Approve as {user.role_recommended}
        </button>
        <div className="flex-1 flex gap-2">
          <select
            value={overrideRole}
            onChange={(e) => setOverrideRole(e.target.value)}
            className="flex-grow p-2 border rounded-md dark:bg-gray-700 text-sm"
          >
            <option>EXCLUSIVE_TALENT</option>
            <option>TALENT</option>
            <option>UGC_CREATOR</option>
          </select>
          <button onClick={handleOverride} className="px-3 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-md">
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CreatorReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/creator-reviews');
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAction = async (userId, action, body) => {
    try {
      await fetch(`/api/admin/creator-reviews/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Refresh list after action
      fetchReviews();
    } catch (error) {
      console.error(`Failed to ${action} user`, error);
      alert(`Could not perform action. See console for details.`);
    }
  };

  if (loading) return <div className="p-8">Loading reviews...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Creator Onboarding Reviews</h1>
      {reviews.length === 0 ? (
        <p>No pending reviews.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(user => (
            <ReviewCard key={user.id} user={user} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
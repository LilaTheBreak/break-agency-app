import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold border-b pb-2 mb-3">{title}</h3>
    {children}
  </div>
);

const ScoreMeter = ({ score }) => (
  <div className="relative h-32 w-32">
    <svg className="w-full h-full" viewBox="0 0 36 36">
      <path
        className="text-gray-200"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke="currentColor" strokeWidth="2"
      />
      <path
        className="text-green-500"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeDasharray={`${score}, 100`}
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-3xl font-bold">{score}</span>
    </div>
  </div>
);

export default function DeliverableReviewPage() {
  const { deliverableId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReview = async () => {
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/review`);
      if (res.ok) {
        const data = await res.json();
        setReview(data);
      }
    } catch (error) {
      console.error('Failed to fetch review', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [deliverableId]);

  const handleApprove = async () => {
    await fetch(`/api/deliverables/${deliverableId}/approve`, { method: 'POST' });
    fetchReview();
  };

  const handleRequestChanges = async () => {
    const feedback = prompt('What changes are needed?');
    if (feedback) {
      await fetch(`/api/deliverables/${deliverableId}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      fetchReview();
    }
  };

  if (loading) return <div className="p-8">Loading AI Review...</div>;
  if (!review) return <div className="p-8">No review data available for this deliverable.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">AI Deliverable Review</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Content Preview */}
          <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-8">
            <p>Content Preview Placeholder</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Section title="AI Summary">
              <p className="text-sm text-gray-600 dark:text-gray-300">{review.aiSummary}</p>
            </Section>
            <Section title="Issues Detected">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {review.aiIssues.map((issue, i) => <li key={i} className="text-red-500">{issue.message}</li>)}
              </ul>
            </Section>
            <Section title="AI Suggestions">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {review.aiSuggestions.map((sugg, i) => <li key={i} className="text-blue-500">{sugg}</li>)}
              </ul>
            </Section>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold mb-4">Overall Score</h3>
            <div className="flex justify-center mb-4">
              <ScoreMeter score={review.aiScore} />
            </div>
            <div className="space-y-2">
              <button onClick={handleApprove} className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md">Approve</button>
              <button onClick={handleRequestChanges} className="w-full px-4 py-2 font-semibold text-white bg-yellow-600 rounded-md">Request Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

interface PanelProps {
  contentItem: any;
}

const FeedbackItem = ({ item }: { item: any }) => (
  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <p className="text-xs font-bold">{item.authorName}</p>
    <p className="text-sm mt-1">{item.comment}</p>
  </div>
);

const ApprovalStatus = ({ approvals, version }: { approvals: any[], version: number }) => {
  const managerApproval = approvals.find(a => a.actor === 'manager' && a.version === version);
  const brandApproval = approvals.find(a => a.actor === 'brand' && a.version === version);

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div>Manager: {managerApproval ? '✅' : '...'}</div>
      <div>→</div>
      <div>Brand: {brandApproval ? '✅' : '...'}</div>
    </div>
  );
};

export default function ContentApprovalPanel({ contentItem }: PanelProps) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddFeedback = async () => {
    await fetch(`/api/content/${contentItem.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName: 'Manager', comment: feedback }),
    });
    setFeedback('');
    // Refetch data
  };

  const handleAiRevise = async () => {
    setLoading(true);
    await fetch(`/api/content/${contentItem.id}/ai-revise`, { method: 'POST' });
    alert('AI revision started. The content will update shortly.');
    setLoading(false);
  };

  const latestVersion = contentItem.versions[0];

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-xl space-y-6">
      <header>
        <h3 className="text-xl font-bold">Feedback & Approvals (V{latestVersion.versionNumber})</h3>
        <ApprovalStatus approvals={contentItem.approvals} version={latestVersion.versionNumber} />
      </header>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {(contentItem.feedback || []).map((item: any) => <FeedbackItem key={item.id} item={item} />)}
      </div>

      <div className="space-y-2">
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Add feedback or change requests..."
          className="w-full p-2 border rounded-md text-sm dark:bg-gray-800"
        />
        <div className="flex justify-between items-center">
          <button onClick={handleAddFeedback} className="text-xs px-3 py-1 border rounded-md">
            Add Feedback
          </button>
          <div className="flex gap-2">
            <button onClick={handleAiRevise} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md">
              {loading ? 'Revising...' : '✨ Apply AI Revisions'}
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md">
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
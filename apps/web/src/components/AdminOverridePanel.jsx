import React, { useState } from 'react';

interface Shortlist {
  id: string;
  brandApprovalStatus: string;
  aiExplanation: string;
  Talent: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  CampaignApprovals?: Array<{
    action: string;
    reason?: string;
    createdAt: string;
  }>;
}

interface AdminOverridePanelProps {
  shortlist: Shortlist;
  onOverride: (shortlistId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function AdminOverridePanel({
  shortlist,
  onOverride,
  isLoading = false
}: AdminOverridePanelProps) {
  const [overrideReason, setOverrideReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isRejected = shortlist.brandApprovalStatus === 'REJECTED';

  const handleSubmitOverride = async () => {
    if (!overrideReason.trim()) {
      alert('Please provide a reason for the override');
      return;
    }

    setSubmitLoading(true);
    try {
      await onOverride(shortlist.id, overrideReason);
      setOverrideReason('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting override:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isRejected) {
    return null; // Don't show panel if not rejected
  }

  // Get the rejection reason from approval history
  const rejectionReason = shortlist.CampaignApprovals
    ?.find(a => a.action === 'BRAND_REJECTED')
    ?.reason;

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {shortlist.Talent.profileImageUrl && (
            <img
              src={shortlist.Talent.profileImageUrl}
              alt={shortlist.Talent.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-amber-900">{shortlist.Talent.name}</h4>
            {shortlist.aiExplanation && (
              <p className="text-sm text-amber-800">{shortlist.aiExplanation}</p>
            )}
          </div>
        </div>
        <span className="px-2 py-1 bg-amber-200 text-amber-900 text-xs font-medium rounded">
          Brand Rejected
        </span>
      </div>

      {rejectionReason && (
        <div className="mb-3 p-2 bg-white rounded text-sm text-gray-700 border border-amber-200">
          <span className="font-medium">Brand feedback:</span> {rejectionReason}
        </div>
      )}

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 disabled:opacity-50 transition"
        >
          Override Rejection
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why you're overriding the brand's rejection. This helps improve future selections."
            className="w-full px-3 py-2 border border-amber-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={3}
            disabled={submitLoading}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitOverride}
              disabled={submitLoading || !overrideReason.trim()}
              className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {submitLoading ? 'Submitting...' : 'Confirm Override'}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setOverrideReason('');
              }}
              disabled={submitLoading}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

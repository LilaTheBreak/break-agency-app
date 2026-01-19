import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminOverridePanelProps {
  campaignId: string;
  onSuccess?: () => void;
}

interface PendingRejection {
  id: string;
  creatorId: string;
  creatorName: string;
  platform: string;
  rejectionReason: string;
  brandEmail: string;
  rejectedAt: string;
}

/**
 * AdminOverridePanel - PART 3
 * 
 * Shows admin:
 * - Pending brand rejections
 * - Option to override with reasoning
 * - Feedback summary
 * 
 * Allows admin to:
 * - Approve the brand's rejection (keep as-is)
 * - Override and reapprove creator
 * - Request brand reconsideration with notes
 */
export const AdminOverridePanel: React.FC<AdminOverridePanelProps> = ({
  campaignId,
  onSuccess
}) => {
  const [pendingRejections, setPendingRejections] = useState<PendingRejection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRejection, setSelectedRejection] = useState<PendingRejection | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPendingRejections();
  }, [campaignId]);

  const fetchPendingRejections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/campaigns/${campaignId}/shortlist/pending-rejections`
      );
      setPendingRejections(response.data.pendingRejections);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch rejections');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!selectedRejection || !overrideReason) {
      setError('Please select a creator and provide override reason');
      return;
    }

    setOverriding(true);
    setError('');

    try {
      await axios.put(
        `/api/admin/shortlist/${selectedRejection.id}/override`,
        { reason: overrideReason }
      );

      setSuccess(true);
      setSelectedRejection(null);
      setOverrideReason('');

      setTimeout(() => {
        setSuccess(false);
        fetchPendingRejections();
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to override rejection');
    } finally {
      setOverriding(false);
    }
  };

  const overrideReasons = [
    { value: 'STRATEGIC_FIT', label: 'Strategic fit outweighs concerns' },
    { value: 'BUDGET_OPTIMIZATION', label: 'Better budget optimization' },
    { value: 'REACH_IMPORTANT', label: 'Reach/audience size is critical' },
    { value: 'BRAND_EVOLUTION', label: 'Aligns with evolving brand direction' },
    { value: 'PORTFOLIO_DIVERSITY', label: 'Needed for portfolio diversity' },
    { value: 'OTHER', label: 'Other reason...' }
  ];

  if (loading) {
    return <div className="p-4 text-gray-500">Loading pending rejections...</div>;
  }

  if (pendingRejections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <svg className="mx-auto w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">No pending rejections. Campaign approval is clean!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="inline-block w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-center text-sm font-bold mr-2">
          {pendingRejections.length}
        </span>
        Pending Brand Rejections
      </h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✓ Override applied successfully
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {pendingRejections.map(rejection => (
          <div
            key={rejection.id}
            onClick={() => setSelectedRejection(selectedRejection?.id === rejection.id ? null : rejection)}
            className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition"
            style={{
              borderColor: selectedRejection?.id === rejection.id ? '#3b82f6' : undefined,
              backgroundColor: selectedRejection?.id === rejection.id ? '#eff6ff' : undefined
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{rejection.creatorName}</h4>
                <p className="text-sm text-gray-600">{rejection.platform}</p>
                <p className="text-xs text-gray-500 mt-1">Rejected by: {rejection.brandEmail}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                  Rejected
                </span>
                <p className="text-xs text-gray-500 mt-1">{new Date(rejection.rejectedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedRejection?.id === rejection.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Brand Reason:</strong> {rejection.rejectionReason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedRejection && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">Override Decision for {selectedRejection.creatorName}</h4>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Why override this rejection?
            </label>
            <div className="space-y-2">
              {overrideReasons.map(reason => (
                <label key={reason.value} className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={overrideReason === reason.value}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {overrideReason === 'OTHER' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explain your decision
              </label>
              <textarea
                placeholder="Why should this creator be approved despite brand concerns?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleOverride}
              disabled={overriding || !overrideReason}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition"
            >
              {overriding ? 'Applying Override...' : 'Apply Override'}
            </button>
            <button
              onClick={() => {
                setSelectedRejection(null);
                setOverrideReason('');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverridePanel;

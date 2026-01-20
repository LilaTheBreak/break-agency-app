import React, { useState, useEffect } from 'react';
import { Mail, Eye, RotateCw, Calendar, AlertCircle, Loader2 } from 'lucide-react';

/**
 * OutreachCampaignList
 * 
 * Table view of all assisted outreach campaigns
 * Shows status, contact info, timestamps
 * Filter by status (Draft, Sent, Replied)
 */

export default function OutreachCampaignList({ onCampaignSelect, onCreateNew }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assisted-outreach/campaigns');
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err.message);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    DRAFT_REQUIRES_APPROVAL: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800', icon: '📝' },
    SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: '✉️' },
    REPLIED: { label: 'Replied', color: 'bg-green-100 text-green-800', icon: '💬' },
    DEFAULT: { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' },
  };

  const getStatusConfig = (status) => statusConfig[status] || statusConfig.DEFAULT;

  const filteredCampaigns = statusFilter === 'ALL' 
    ? campaigns
    : campaigns.filter(c => c.status === statusFilter);

  const goalDisplay = (goal) => {
    const mapping = {
      STRATEGY_AUDIT: 'Strategy Audit',
      CREATIVE_CONCEPTS: 'Creative Concepts',
      CREATOR_MATCHING: 'Creator Matching'
    };
    return mapping[goal] || goal;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assisted Outreach Campaigns</h2>
          <p className="text-gray-600">Premium, semi-automated outreach</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
        >
          <Mail className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['ALL', 'DRAFT_REQUIRES_APPROVAL', 'SENT', 'REPLIED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status === 'ALL' ? 'All' : getStatusConfig(status).label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading campaigns...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Brand</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Goal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Drafts</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Replies</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => {
                const statusConfig = getStatusConfig(campaign.status);
                const draftsCount = campaign.drafts?.length || 0;
                const repliesCount = campaign.replies?.length || 0;

                return (
                  <tr key={campaign.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-semibold text-gray-900">{campaign.brand?.name || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="text-gray-900">{campaign.contact?.firstName} {campaign.contact?.lastName}</p>
                      <p className="text-gray-600 text-xs font-mono">{campaign.contact?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-gray-900">{goalDisplay(campaign.goal)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded font-mono text-xs font-semibold">
                        {draftsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {repliesCount > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-xs font-semibold">
                          {repliesCount}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="text-xs">{formatDate(campaign.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button
                        onClick={() => onCampaignSelect(campaign)}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            {statusFilter === 'ALL' 
              ? 'No outreach campaigns yet.'
              : `No ${getStatusConfig(statusFilter).label.toLowerCase()} campaigns.`}
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg inline-flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Create First Campaign
          </button>
        </div>
      )}

      {/* Stats */}
      {!loading && campaigns.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold">Total Campaigns</p>
            <p className="text-2xl font-bold text-blue-900">{campaigns.length}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-600 font-semibold">Drafts</p>
            <p className="text-2xl font-bold text-yellow-900">
              {campaigns.filter(c => c.status === 'DRAFT_REQUIRES_APPROVAL').length}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold">Sent</p>
            <p className="text-2xl font-bold text-blue-900">
              {campaigns.filter(c => c.status === 'SENT' || c.status === 'REPLIED').length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-semibold">Positive Replies</p>
            <p className="text-2xl font-bold text-green-900">
              {campaigns.reduce((sum, c) => sum + (c.replies?.length || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

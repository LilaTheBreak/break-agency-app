import React, { useState, useEffect } from 'react';
import { Mail, Eye, RotateCw, Calendar, AlertCircle, Loader2, X } from 'lucide-react';

/**
 * OutreachCampaignList
 * 
 * Table view of all assisted outreach campaigns
 * Shows status, contact info, timestamps
 * Filter by status (Draft, Sent, Replied)
 */

export default function OutreachCampaignList({ onCampaignSelect, onCreateNew, refreshTrigger = 0 }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [brands, setBrands] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [formData, setFormData] = useState({
    brandId: '',
    contactId: '',
    goal: 'STRATEGY_AUDIT',
    senderUserId: '',
    confirmDuplicate: false
  });

  // Helper functions
  const statusConfig = {
    DRAFT_REQUIRES_APPROVAL: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800', icon: '📝' },
    SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: '✉️' },
    REPLIED: { label: 'Replied', color: 'bg-green-100 text-green-800', icon: '💬' },
    BOOKED: { label: 'Booked', color: 'bg-purple-100 text-purple-800', icon: '📅' },
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

  // Effects
  useEffect(() => {
    fetchCampaigns();
    loadFormOptions();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [refreshTrigger]);

  // API calls
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

  const loadFormOptions = async () => {
    try {
      // Fetch brands
      const brandRes = await fetch('/api/brands');
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        setBrands(Array.isArray(brandData) ? brandData : (brandData.brands || []));
      }

      // Fetch contacts
      const contactRes = await fetch('/api/crm/contacts');
      if (contactRes.ok) {
        const contactData = await contactRes.json();
        setContacts(Array.isArray(contactData) ? contactData : (contactData.contacts || []));
      }

      // Fetch users
      const userRes = await fetch('/api/users');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : (userData.users || []));
      }
    } catch (err) {
      console.error('Failed to load form options:', err);
    }
  };

  const checkDuplicates = async (brandId, contactId) => {
    try {
      const response = await fetch(`/api/assisted-outreach/campaigns/check-duplicate?brandId=${brandId}&contactId=${contactId}`);
      if (response.ok) {
        const data = await response.json();
        return data.hasDuplicate ? data.duplicateCampaign : null;
      }
    } catch (err) {
      console.error('Failed to check duplicates:', err);
    }
    return null;
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    if (!formData.brandId || !formData.contactId || !formData.senderUserId) {
      setCreateError('All fields are required');
      return;
    }

    // Check for duplicates first
    if (!formData.confirmDuplicate) {
      const duplicate = await checkDuplicates(formData.brandId, formData.contactId);
      if (duplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
    }

    setCreating(true);
    setCreateError(null);
    setDuplicateWarning(null);

    try {
      const response = await fetch('/api/assisted-outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: formData.brandId,
          contactId: formData.contactId,
          goal: formData.goal,
          senderUserId: formData.senderUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const data = await response.json();
      setShowCreateModal(false);
      setFormData({
        brandId: '',
        contactId: '',
        goal: 'STRATEGY_AUDIT',
        senderUserId: '',
        confirmDuplicate: false
      });
      await fetchCampaigns();
      onCampaignSelect?.(data.campaign);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Render
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assisted Outreach Campaigns</h2>
          <p className="text-gray-600">Premium, semi-automated outreach</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
        >
          <Mail className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold">Create New Campaign</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setDuplicateWarning(null);
                  setCreateError(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {createError}
                </div>
              )}

              {duplicateWarning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="font-semibold text-yellow-800 mb-2">⚠️ Duplicate Outreach Detected</p>
                  <p className="text-yellow-700 text-xs mb-3">
                    This contact has already been emailed in campaign <strong>{duplicateWarning.id}</strong> (status: {duplicateWarning.status}).
                  </p>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.confirmDuplicate}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmDuplicate: e.target.checked }))}
                    />
                    <span className="text-xs text-yellow-700">I understand. Proceed anyway.</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand*</label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact*</label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outreach Goal*</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STRATEGY_AUDIT">Strategy Audit</option>
                  <option value="CREATIVE_CONCEPTS">Creative Concepts</option>
                  <option value="CREATOR_MATCHING">Creator Matching</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender*</label>
                <select
                  value={formData.senderUserId}
                  onChange={(e) => setFormData(prev => ({ ...prev, senderUserId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select who sends this</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email || user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setDuplicateWarning(null);
                    setCreateError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={creating || !formData.brandId || !formData.contactId || !formData.senderUserId}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['ALL', 'DRAFT_REQUIRES_APPROVAL', 'SENT', 'REPLIED', 'BOOKED'].map((status) => (
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
      {!loading && filteredCampaigns.length > 0 && (
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
                const config = getStatusConfig(campaign.status);
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                        {config.icon} {config.label}
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
            onClick={() => setShowCreateModal(true)}
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
              {campaigns.filter(c => c.status === 'SENT' || c.status === 'REPLIED' || c.status === 'BOOKED').length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-semibold">Positive Replies</p>
            <p className="text-2xl font-bold text-green-900">
              {campaigns.reduce((sum, c) => sum + (c.replies?.filter(r => r.sentiment === 'POSITIVE').length || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

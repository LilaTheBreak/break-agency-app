import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Search, MoreVertical, Send, Clock, CheckCircle, AlertCircle, Mail, User, Calendar, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { OutreachMetrics } from '../services/outreachMetricsService';

interface Outreach {
  id: string;
  target: string;
  type: string;
  contact?: string;
  contactEmail?: string;
  link?: string;
  owner?: string;
  source?: string;
  stage: string;
  status: string;
  summary?: string;
  emailsSent: number;
  emailsReplies: number;
  lastContact?: string;
  nextFollowUp?: string;
  archived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  Brand?: { id: string; name: string };
  OutreachEmailThread?: Array<{ id: string; status: string }>;
  OutreachNote?: Array<{ id: string; body: string; createdAt: string; author: string }>;
  OutreachTask?: Array<{ id: string; title: string; status: string; dueDate?: string }>;
  SalesOpportunity?: Array<{ id: string; stage: string; dealId?: string }>;
}

interface MetricsData {
  totalOutreach: number;
  byStage: { [key: string]: number };
  responseRate: number;
  conversionToMeetings: number;
  conversionToOpportunities: number;
  conversionToDeals: number;
  averageTimeToReply: number;
  pendingFollowUps: number;
  overdueFolowUps: number;
  topSources: Array<{ source: string; count: number }>;
  topTypes: Array<{ type: string; count: number }>;
}

const STAGES = [
  'not_started',
  'awaiting_reply',
  'replied',
  'qualified',
  'meeting_scheduled',
  'closed',
];

const getStageColor = (stage: string): string => {
  const colors: { [key: string]: string } = {
    not_started: 'bg-gray-100 text-gray-800',
    awaiting_reply: 'bg-blue-100 text-blue-800',
    replied: 'bg-green-100 text-green-800',
    qualified: 'bg-purple-100 text-purple-800',
    meeting_scheduled: 'bg-orange-100 text-orange-800',
    closed: 'bg-red-100 text-red-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

const getStageIcon = (stage: string): React.ReactNode => {
  switch (stage) {
    case 'not_started':
      return <AlertCircle size={16} />;
    case 'awaiting_reply':
      return <Mail size={16} />;
    case 'replied':
      return <CheckCircle size={16} />;
    case 'qualified':
      return <User size={16} />;
    case 'meeting_scheduled':
      return <Calendar size={16} />;
    case 'closed':
      return <CheckCircle size={16} />;
    default:
      return null;
  }
};

export interface OutreachSectionProps {
  talentId?: string;
  brandId?: string;
}

export default function OutreachSection({ talentId, brandId }: OutreachSectionProps) {
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [selectedOutreach, setSelectedOutreach] = useState<Outreach | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({ target: '', contact: '', contactEmail: '', source: '' });
  const [activeTab, setActiveTab] = useState<'list' | 'pipeline' | 'metrics'>('list');
  const [generatingMetrics, setGeneratingMetrics] = useState(false);

  // Fetch outreach records
  const fetchOutreach = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStage) params.append('stage', filterStage);

      const response = await fetch(`/api/outreach?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setOutreach(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch outreach records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStage]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    setGeneratingMetrics(true);
    try {
      const response = await fetch('/api/outreach/metrics/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      toast.error('Failed to load metrics');
      console.error(error);
    } finally {
      setGeneratingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchOutreach();
  }, [searchQuery, filterStage]);

  useEffect(() => {
    if (activeTab === 'metrics') {
      fetchMetrics();
    }
  }, [activeTab]);

  // Handle create new outreach
  const handleCreateOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create');
      const data = await response.json();
      setOutreach([data.data, ...outreach]);
      setFormData({ target: '', contact: '', contactEmail: '', source: '' });
      setShowNewForm(false);
      toast.success('Outreach record created');
    } catch (error) {
      toast.error('Failed to create outreach record');
      console.error(error);
    }
  };

  // Handle update stage
  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      const response = await fetch(`/api/outreach/${id}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ stage }),
      });

      if (!response.ok) throw new Error('Failed to update');
      const data = await response.json();

      // Update local state
      setOutreach(outreach.map((o) => (o.id === id ? data.data : o)));
      if (selectedOutreach?.id === id) setSelectedOutreach(data.data);
      toast.success('Stage updated');
    } catch (error) {
      toast.error('Failed to update stage');
      console.error(error);
    }
  };

  // Handle mark as replied
  const handleMarkReplied = async (id: string) => {
    try {
      const response = await fetch(`/api/outreach/${id}/mark-replied`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ emailCount: 1 }),
      });

      if (!response.ok) throw new Error('Failed to mark');
      const data = await response.json();
      setOutreach(outreach.map((o) => (o.id === id ? data.data : o)));
      if (selectedOutreach?.id === id) setSelectedOutreach(data.data);
      toast.success('Marked as replied');
    } catch (error) {
      toast.error('Failed to mark as replied');
      console.error(error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this record?')) return;

    try {
      const response = await fetch(`/api/outreach/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');
      setOutreach(outreach.filter((o) => o.id !== id));
      setShowDetailModal(false);
      toast.success('Record archived');
    } catch (error) {
      toast.error('Failed to delete record');
      console.error(error);
    }
  };

  // Render LIST TAB
  const renderListTab = () => (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by contact name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <select
          value={filterStage || ''}
          onChange={(e) => setFilterStage(e.target.value || null)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">All Stages</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          New Outreach
        </button>
      </div>

      {/* New Form */}
      {showNewForm && (
        <form onSubmit={handleCreateOutreach} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Company/Target name"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Contact person"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              type="email"
              placeholder="Contact email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Select source</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Email">Email</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              <Plus size={14} />
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Outreach List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : outreach.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No outreach records found. Create one to get started!</div>
      ) : (
        <div className="space-y-2">
          {outreach.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedOutreach(item);
                setShowDetailModal(true);
              }}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{item.target}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStageColor(item.stage)}`}>
                      {getStageIcon(item.stage)}
                      {item.stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.contact && `${item.contact} • `}
                    {item.contactEmail || item.source}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {item.emailsSent} sent
                    </span>
                    {item.emailsReplies > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        {item.emailsReplies} replies
                      </span>
                    )}
                  </div>
                  {item.nextFollowUp && (
                    <span className="flex items-center gap-1 text-xs text-orange-600">
                      <Clock size={12} />
                      Follow up: {new Date(item.nextFollowUp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render PIPELINE TAB
  const renderPipelineTab = () => {
    const stageGroups = STAGES.reduce(
      (acc, stage) => {
        acc[stage] = outreach.filter((o) => o.stage === stage && !o.archived);
        return acc;
      },
      {} as { [key: string]: Outreach[] }
    );

    return (
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-gray-50 rounded-lg p-4 min-w-80">
            <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${getStageColor(stage)} px-2 py-1 rounded`}>
              {getStageIcon(stage)}
              <h3 className="font-semibold text-sm">{stage.replace(/_/g, ' ')}</h3>
              <span className="text-xs font-bold ml-auto">{stageGroups[stage]?.length || 0}</span>
            </div>

            <div className="space-y-2">
              {stageGroups[stage]?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedOutreach(item);
                    setShowDetailModal(true);
                  }}
                  className="bg-white border border-gray-200 rounded p-3 hover:shadow-md cursor-pointer transition"
                >
                  <h4 className="font-semibold text-sm text-gray-900">{item.target}</h4>
                  <p className="text-xs text-gray-600 mt-1">{item.contact}</p>
                  {item.emailsReplies > 0 && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {item.emailsReplies} replies
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render METRICS TAB
  const renderMetricsTab = () => (
    <div className="space-y-6">
      {generatingMetrics ? (
        <div className="text-center py-8 text-gray-500">Calculating metrics...</div>
      ) : metrics ? (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Total Outreach</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalOutreach}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Response Rate</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{metrics.responseRate}%</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Converted to Opportunities</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">{metrics.conversionToOpportunities}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Converted to Deals</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{metrics.conversionToDeals}</div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Pending Follow-ups</div>
              <div className="text-2xl font-bold text-orange-600 mt-2">{metrics.pendingFollowUps}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Overdue Follow-ups</div>
              <div className="text-2xl font-bold text-red-600 mt-2">{metrics.overdueFolowUps}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-gray-600 text-sm font-medium">Avg Time to Reply</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{metrics.averageTimeToReply} days</div>
            </div>
          </div>

          {/* Stage Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Outreach by Stage</h3>
            <div className="space-y-3">
              {STAGES.map((stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 min-w-40">{stage.replace(/_/g, ' ')}</span>
                  <div className="flex-1 max-w-xs mx-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(metrics.byStage[stage] || 0 / metrics.totalOutreach) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 min-w-12">{metrics.byStage[stage] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          {metrics.topSources.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Top Sources</h3>
              <div className="space-y-2">
                {metrics.topSources.map((source) => (
                  <div key={source.source} className="flex justify-between text-sm">
                    <span>{source.source}</span>
                    <span className="font-semibold">{source.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Load Metrics
          </button>
        </div>
      )}
    </div>
  );

  // Render DETAIL MODAL
  const renderDetailModal = () => {
    if (!selectedOutreach) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedOutreach.target}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedOutreach.contact} • {selectedOutreach.contactEmail}
              </p>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Stage Management */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Current Stage</label>
              <select
                value={selectedOutreach.stage}
                onChange={(e) => handleUpdateStage(selectedOutreach.id, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-medium ${getStageColor(selectedOutreach.stage)}`}
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Tracking */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Emails Sent</label>
                <div className="text-2xl font-bold text-gray-900">{selectedOutreach.emailsSent}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Replies Received</label>
                <div className="text-2xl font-bold text-green-600">{selectedOutreach.emailsReplies}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleMarkReplied(selectedOutreach.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Mark as Replied
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedOutreach.id)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Notes */}
            {selectedOutreach.OutreachNote && selectedOutreach.OutreachNote.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedOutreach.OutreachNote.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                      {note.body}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {(['list', 'pipeline', 'metrics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'list' && 'Outreach List'}
            {tab === 'pipeline' && 'Pipeline'}
            {tab === 'metrics' && 'Metrics'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && renderListTab()}
      {activeTab === 'pipeline' && renderPipelineTab()}
      {activeTab === 'metrics' && renderMetricsTab()}

      {/* Detail Modal */}
      {showDetailModal && renderDetailModal()}
    </div>
  );
}

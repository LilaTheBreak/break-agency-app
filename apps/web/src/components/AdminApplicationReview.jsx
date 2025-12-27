import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function AdminApplicationReview() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`/api/opportunities/admin/applications?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, notes = '') => {
    try {
      const response = await fetch(`/api/opportunities/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) throw new Error('Failed to update application');

      const data = await response.json();
      
      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? data.application : app))
      );

      if (status === 'approved') {
        toast.success('Application approved! Deal created automatically.');
      } else if (status === 'rejected') {
        toast.success('Application rejected');
      } else {
        toast.success('Application status updated');
      }

      setSelectedApp(null);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
        <p className="text-gray-600 mt-1">Review and manage creator applications to opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Users}
          color="bg-gray-100 text-gray-700"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-100 text-yellow-700"
        />
        <StatCard
          label="Shortlisted"
          value={stats.shortlisted}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'shortlisted', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 mt-4">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No applications found</p>
          <p className="text-gray-500 text-sm mt-1">
            {filter !== 'all' ? 'Try changing your filter' : 'Applications will appear here when creators apply'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onView={() => setSelectedApp(app)}
              onApprove={() => updateApplicationStatus(app.id, 'approved')}
              onReject={() => updateApplicationStatus(app.id, 'rejected')}
              onShortlist={() => updateApplicationStatus(app.id, 'shortlisted')}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdateStatus={updateApplicationStatus}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ application, onView, onApprove, onReject, onShortlist }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    shortlisted: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-3">
            {application.User.avatarUrl ? (
              <img
                src={application.User.avatarUrl}
                alt={application.User.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {application.User.name || 'Anonymous Creator'}
              </h3>
              <p className="text-sm text-gray-600">{application.User.email}</p>
            </div>
          </div>

          {/* Opportunity */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Applying to:</p>
            <p className="font-medium text-gray-900">{application.opportunity.title}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <span>{application.opportunity.brand}</span>
              <span>•</span>
              <span>{application.opportunity.payment}</span>
            </div>
          </div>

          {/* Pitch Preview */}
          {application.pitch && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 line-clamp-2">{application.pitch}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
            {application.proposedRate && <span>• Proposed: ${application.proposedRate}</span>}
            {application.User.Talent && (
              <>
                {application.User.Talent.instagramHandle && (
                  <span>• @{application.User.Talent.instagramHandle}</span>
                )}
                {application.User.Talent.followers && (
                  <span>• {application.User.Talent.followers.toLocaleString()} followers</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col items-end gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              statusColors[application.status]
            }`}
          >
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {application.status === 'pending' && (
              <>
                <button
                  onClick={onShortlist}
                  className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={onApprove}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={onReject}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </>
            )}

            {application.status === 'shortlisted' && (
              <>
                <button
                  onClick={onApprove}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={onReject}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailModal({ application, onClose, onUpdateStatus }) {
  const [notes, setNotes] = useState(application.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status) => {
    setIsUpdating(true);
    await onUpdateStatus(application.id, status, notes);
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Eye className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Creator Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Creator Information</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {application.User.avatarUrl ? (
                <img
                  src={application.User.avatarUrl}
                  alt={application.User.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{application.User.name}</h4>
                <p className="text-sm text-gray-600">{application.User.email}</p>
                {application.User.Talent && (
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    {application.User.Talent.instagramHandle && (
                      <span>IG: @{application.User.Talent.instagramHandle}</span>
                    )}
                    {application.User.Talent.tiktokHandle && (
                      <span>TT: @{application.User.Talent.tiktokHandle}</span>
                    )}
                    {application.User.Talent.followers && (
                      <span>{application.User.Talent.followers.toLocaleString()} followers</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opportunity */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Opportunity</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-900">{application.opportunity.title}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Brand:</span>
                  <span className="ml-2 text-gray-900">{application.opportunity.brand}</span>
                </div>
                <div>
                  <span className="text-gray-500">Payment:</span>
                  <span className="ml-2 text-gray-900">{application.opportunity.payment}</span>
                </div>
                {application.opportunity.deadline && (
                  <div>
                    <span className="text-gray-500">Deadline:</span>
                    <span className="ml-2 text-gray-900">{application.opportunity.deadline}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pitch */}
          {application.pitch && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Creator Pitch</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{application.pitch}</p>
              </div>
            </div>
          )}

          {/* Proposed Rate */}
          {application.proposedRate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Proposed Rate</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">${application.proposedRate}</p>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add internal notes about this application..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            
            {application.status !== 'rejected' && (
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                Reject
              </button>
            )}
            
            {application.status !== 'shortlisted' && application.status !== 'approved' && (
              <button
                onClick={() => handleStatusUpdate('shortlisted')}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                Shortlist
              </button>
            )}
            
            {application.status !== 'approved' && (
              <button
                onClick={() => handleStatusUpdate('approved')}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                Approve & Create Deal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

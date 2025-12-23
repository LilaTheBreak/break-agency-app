import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardShell } from '../components/DashboardShell';

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function AdminUserApprovals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only admin can access
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      navigate('/');
      return;
    }
    fetchPendingUsers();
  }, [user, navigate]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/admin/users/pending`, {
        credentials: 'include'
      });
      
      // Handle permission errors
      if (response.status === 403) {
        setError("You don't have permission to view pending users");
        setPendingUsers([]);
        return;
      }
      
      // Handle not found
      if (response.status === 404) {
        setError("Pending users not available yet");
        setPendingUsers([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Unable to load pending users');
      }

      const data = await response.json();
      // Ensure users is always an array
      setPendingUsers(Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load pending users");
      setPendingUsers([]);
      console.error('[FETCH PENDING USERS]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (user) => {
    setSelectedUser(user);
    setActionType('approve');
    setNotes('');
  };

  const handleReject = (user) => {
    setSelectedUser(user);
    setActionType('reject');
    setNotes('');
  };

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
    setNotes('');
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      setProcessing(true);
      const endpoint = `${API_BASE}/api/admin/users/${selectedUser.id}/${actionType}`;
      const body = actionType === 'approve' 
        ? { notes } 
        : { reason: notes };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} user`);
      }

      const result = await response.json();
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      
      // Show success message
      alert(`User ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      closeModal();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error(`[${actionType.toUpperCase()} USER]`, err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseResponses = (responses) => {
    if (!responses) return {};
    try {
      return typeof responses === 'string' ? JSON.parse(responses) : responses;
    } catch {
      return {};
    }
  };

  const renderOnboardingSnapshot = (responses) => {
    if (!responses || Object.keys(responses).length === 0) return null;
    const join = (val) => {
      if (!val) return "—";
      if (Array.isArray(val)) return val.length ? val.join(", ") : "—";
      return val;
    };
    const fields = [
      { label: "Primary goal", value: join(responses.primaryGoal) },
      { label: "Platforms", value: join(responses.platforms) },
      { label: "Formats", value: join(responses.formats) },
      { label: "Niche", value: join(responses.primaryNiche) },
      { label: "Angles", value: join(responses.contentAngles) },
      { label: "Blockers", value: join(responses.blockers) },
      { label: "Capacity", value: join(responses.capacity || responses.ugcCapacity) },
      { label: "Lead time", value: join(responses.leadTime) },
      { label: "Partnership preference", value: join(responses.partnershipPreference) },
      { label: "Proof points", value: join(responses.proofPoints) }
    ];
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Onboarding → CRM</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="text-sm text-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500">{field.label}</p>
              <p className="text-sm text-gray-900">{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and approve new user applications
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pending users...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {!loading && !error && pendingUsers.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-green-900">All caught up!</h3>
            <p className="mt-2 text-green-700">No pending user approvals at this time.</p>
          </div>
        )}

        {!loading && !error && pendingUsers.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {Array.isArray(pendingUsers) && pendingUsers.map((pendingUser) => {
                const responses = parseResponses(pendingUser.onboarding_responses);
                
                return (
                  <li key={pendingUser.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pendingUser.name || pendingUser.email}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {pendingUser.role}
                          </span>
                        </div>
                        
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{pendingUser.email}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Applied</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(pendingUser.created_at)}
                            </dd>
                          </div>
                          
                          {responses.context && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Context</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.context}</dd>
                            </div>
                          )}

                          {responses.preferredName && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Preferred Name</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.preferredName}</dd>
                            </div>
                          )}

                          {responses.platforms && responses.platforms.length > 0 && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Platforms</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.platforms.join(', ')}</dd>
                            </div>
                          )}

                          {responses.primaryNiche && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Primary Niche</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.primaryNiche}</dd>
                            </div>
                          )}

                          {responses.primaryGoal && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Primary Goal</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.primaryGoal}</dd>
                            </div>
                          )}

                          {responses.revenueRange && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Revenue Range</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.revenueRange}</dd>
                            </div>
                          )}

                          {responses.targetAmount && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Target Amount</dt>
                              <dd className="mt-1 text-sm text-gray-900">£{responses.targetAmount}</dd>
                            </div>
                          )}

                          {responses.usp && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">USP</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.usp}</dd>
                            </div>
                          )}
                          
                          {responses.company && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Company</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.company}</dd>
                            </div>
                          )}
                          
                          {responses.experience && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Experience</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.experience}</dd>
                            </div>
                          )}
                          
                          {responses.goal && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Goal</dt>
                              <dd className="mt-1 text-sm text-gray-900">{responses.goal}</dd>
                            </div>
                          )}

                          {pendingUser.admin_notes && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Admin Notes</dt>
                              <dd className="mt-1 text-sm text-gray-900">{pendingUser.admin_notes}</dd>
                            </div>
                          )}

                          {/* Show button to expand full details */}
                          <div className="sm:col-span-2">
                            <button
                              onClick={() => console.log('Full responses:', responses)}
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              View full application details
                            </button>
                          </div>
                        </dl>
                        {renderOnboardingSnapshot(responses)}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-6">
                        <button
                          onClick={() => handleApprove(pendingUser)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(pendingUser)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Confirmation Modal */}
        {selectedUser && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                    actionType === 'approve' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {actionType === 'approve' ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {actionType === 'approve' ? 'Approve User' : 'Reject User'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionType === 'approve' 
                          ? `Approve ${selectedUser.name || selectedUser.email} as ${selectedUser.role}?`
                          : `Reject application from ${selectedUser.name || selectedUser.email}?`
                        }
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 text-left">
                        {actionType === 'approve' ? 'Notes (optional)' : 'Reason for rejection'}
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={actionType === 'approve' ? 'Add any notes...' : 'Provide a reason...'}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={confirmAction}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${
                      actionType === 'approve'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

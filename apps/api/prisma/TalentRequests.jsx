import React, { useState, useEffect } from 'react';

const RequestRow = ({ request, onAction }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td className="px-6 py-4">
      <div className="text-sm font-medium">{request.brand.name}</div>
    </td>
    <td className="px-6 py-4">
      <div className="text-sm font-medium">{request.talent.user.name}</div>
    </td>
    <td className="px-6 py-4 text-sm">${request.budgetMin} - ${request.budgetMax}</td>
    <td className="px-6 py-4 text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
      <button onClick={() => onAction(request.id, 'approve')} className="text-green-600 hover:text-green-900">Approve</button>
      <button onClick={() => onAction(request.id, 'decline')} className="text-red-600 hover:text-red-900">Decline</button>
    </td>
  </tr>
);

export default function TalentRequestsAdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/talent-requests');
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch talent requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    await fetch(`/api/admin/talent-requests/${id}/${action}`, { method: 'POST' });
    fetchRequests(); // Refresh list
  };

  if (loading) return <div className="p-8">Loading Talent Requests...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Talent Requests for Review</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {requests.length > 0 ? (
              requests.map(req => <RequestRow key={req.id} request={req} onAction={handleAction} />)
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No pending talent requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const ApplicationRow = ({ app, onAction }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-gray-900 dark:text-white">{app.user.name}</div>
      <div className="text-sm text-gray-500">{app.user.email}</div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.categories.join(', ')}</td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
      <button onClick={() => onAction(app.id, 'approve')} className="text-green-600 hover:text-green-900">Approve</button>
      <button onClick={() => onAction(app.id, 'reject')} className="text-red-600 hover:text-red-900">Reject</button>
    </td>
  </tr>
);

export default function UgcApplicationsAdminPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/ugc-applications');
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id, action) => {
    let notes = '';
    if (action === 'reject') {
      notes = prompt('Reason for rejection (optional):');
    }
    await fetch(`/api/admin/ugc-applications/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: notes }),
    });
    fetchApplications(); // Refresh the list
  };

  if (loading) return <div className="p-8">Loading Applications...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">UGC Marketplace Applications</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {applications.length > 0 ? (
              applications.map(app => <ApplicationRow key={app.id} app={app} onAction={handleAction} />)
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No pending applications.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
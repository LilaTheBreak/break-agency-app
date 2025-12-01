import React, { useState, useEffect } from 'react';

const CampaignRow = ({ campaign, onReview }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-gray-900 dark:text-white">{campaign.title}</div>
      <div className="text-sm text-gray-500">{campaign.user.name}</div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.categories.join(', ')}</td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        {campaign.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(campaign.createdAt).toLocaleDateString()}</td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <button onClick={() => onReview(campaign.id)} className="text-indigo-600 hover:text-indigo-900">Review</button>
    </td>
  </tr>
);

export default function BrandCampaignsAdminPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      // Fetch only submitted campaigns for review
      const res = await fetch('/api/admin/brand-campaigns?status=submitted');
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleReview = async (id) => {
    const newStatus = prompt('Enter new status (e.g., "reviewing", "approved", "rejected"):');
    if (!newStatus) return;

    await fetch(`/api/admin/brand-campaigns/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCampaigns(); // Refresh list
  };

  if (loading) return <div className="p-8">Loading Campaigns for Review...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Brand Campaign Submissions</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign & Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {campaigns.length > 0 ? (
              campaigns.map(c => <CampaignRow key={c.id} campaign={c} onReview={handleReview} />)
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No campaigns awaiting review.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
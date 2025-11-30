import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { can } from '../../web/src/utils/permissions'; // Adjust path as needed
import { useUser } from '@clerk/clerk-react'; // Example hook to get user

const CampaignCard = ({ campaign }: { campaign: any }) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h3 className="font-bold">{campaign.title}</h3>
    <p className="text-sm text-gray-500">Status: <span className="font-semibold capitalize">{campaign.status}</span></p>
    <p className="text-xs mt-2">Budget: £{campaign.budgetMin} - £{campaign.budgetMax}</p>
    <Link to={`/brand/campaign/${campaign.id}`} className="text-xs text-blue-500 mt-2 inline-block">View Details →</Link>
  </div>
);

export default function BrandDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser(); // Example: Get user from Clerk or context

  useEffect(() => {
    fetch('/api/brand/campaigns') // This will now hit your new authenticated route
      .then(res => res.json())
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Campaigns</h1>
        {can(user, 'brand_portal') && (
          <Link to="/brand/campaign/create" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
            + New Campaign
          </Link>
        )}
      </div>
      {loading ? (
        <p>Loading campaigns...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} />)}
        </div>
      )}
    </div>
  );
}
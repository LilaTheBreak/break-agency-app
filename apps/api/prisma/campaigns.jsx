import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/brand/campaigns/list');
        const data = await res.json();
        setCampaigns(data);
      } catch (error) {
        console.error('Failed to fetch campaigns', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loading) return <div className="p-8">Loading Campaigns...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Campaigns</h1>
      <div className="space-y-4">
        {campaigns.map(campaign => (
          <Link to={`/brand/campaigns/${campaign.id}`} key={campaign.id} className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg">
            <div className="flex justify-between">
              <h2 className="font-bold text-xl">{campaign.title}</h2>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold border-b pb-2 mb-3">{title}</h2>
    {children}
  </div>
);

const CreatorMatchCard = ({ match }) => (
  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <img src={match.avatarUrl} className="w-12 h-12 rounded-full" />
    <div>
      <p className="font-semibold">{match.name}</p>
      <p className="text-sm">Match Score: <span className="font-bold text-blue-500">{match.matchScore}%</span></p>
    </div>
  </div>
);

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/brand-campaigns/${id}`);
        if (!res.ok) throw new Error('Campaign not found');
        const data = await res.json();
        setCampaign(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  if (loading) return <div className="p-8">Loading Campaign Details...</div>;
  if (!campaign) return <div className="p-8">Campaign not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">{campaign.title}</h1>
      <p className="text-gray-500 mb-6">Status: <span className="font-semibold capitalize">{campaign.status}</span></p>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <Section title="AI Summary & Insights">
          <p className="mb-2">{campaign.aiSummary?.objective}</p>
          <div className="flex flex-wrap gap-2">
            {campaign.aiKeywords?.map(kw => <span key={kw} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{kw}</span>)}
          </div>
        </Section>

        <Section title="AI Recommended Deliverables">
          <ul className="list-disc list-inside">
            {campaign.aiDeliverables?.map((d, i) => <li key={i}>{d.count}x {d.type} on {d.platform}</li>)}
          </ul>
        </Section>

        <Section title="AI Creator Matches">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaign.aiCreatorMatches?.map(match => <CreatorMatchCard key={match.id} match={match} />)}
          </div>
        </Section>
      </div>
    </div>
  );
}
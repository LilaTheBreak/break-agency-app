import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CreatorCard = ({ creator }) => (
  <Link to={`/brand/discovery/profile/${creator.id}`} className="block">
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 text-center hover:shadow-xl transition-shadow">
      <img
        src={creator.avatarUrl || 'https://via.placeholder.com/100'}
        alt={creator.name}
        className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
      />
      <h3 className="font-bold">{creator.name}</h3>
      {creator.roster_category && <p className="text-xs text-gray-500 capitalize">{creator.roster_category.replace('_', ' ')}</p>}
    </div>
  </Link>
);

const DiscoverySection = ({ title, creators }) => {
  if (!creators || creators.length === 0) return null;
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {creators.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} />
        ))}
      </div>
    </section>
  );
};

export default function BrandDiscoveryHome() {
  const [discoveryData, setDiscoveryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/brand/discovery');
        const data = await res.json();
        setDiscoveryData(data);
      } catch (error) {
        console.error('Failed to fetch discovery data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading Discovery...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discover Creators</h1>
        <Link to="/brand/discovery/filter" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Advanced Filter
        </Link>
      </div>

      <DiscoverySection title="Recommended For You" creators={discoveryData?.recommendedCreators} />
      <DiscoverySection title="Friends of the House" creators={discoveryData?.vip} />
      <DiscoverySection title="Trending Creators" creators={discoveryData?.trendingCreators} />
      {/* Special handling for UGC listings */}
      {discoveryData?.newUGC && (
        <DiscoverySection
          title="New UGC Creators"
          creators={discoveryData.newUGC.map(ugc => ({ ...ugc.creator, id: ugc.creator.id }))}
        />
      )}
    </div>
  );
}
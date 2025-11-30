import React, { useState, useEffect } from 'react';

const CreatorCard = ({ listing }: { listing: any }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
    <img src={listing.creator.avatarUrl || 'https://via.placeholder.com/100'} alt={listing.creator.name} className="w-20 h-20 rounded-full mx-auto mb-2" />
    <h4 className="font-bold">{listing.creator.name}</h4>
    <p className="text-xs text-gray-500 mb-2">{(listing.tags || []).join(', ')}</p>
    <div className="flex gap-2 justify-center">
      <button className="text-xs px-3 py-1 border rounded-md">Send Gift</button>
      <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md">Request UGC</button>
    </div>
  </div>
);

export default function UGCMarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ugc/listings')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch listings');
        return res.json();
      })
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading UGC Marketplace...</div>;
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold">UGC Creator Marketplace</h1>
        <p className="text-lg text-gray-500">Discover authentic creators for your next campaign.</p>
      </header>

      {/* Add filters for category, niche, etc. here */}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {listings.map(listing => (
          <CreatorCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
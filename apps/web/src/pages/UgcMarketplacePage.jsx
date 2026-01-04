import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CreatorCard = ({ listing }) => (
  <Link to={`/ugc/listings/${listing.creator.id}`} className="block">
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 text-center hover:shadow-xl transition-shadow">
      <img
        src={listing.creator.avatarUrl || 'https://via.placeholder.com/100'}
        alt={listing.creator.name}
        className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
      />
      <h3 className="font-bold">{listing.creator.name}</h3>
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {listing.portfolio?.categories?.slice(0, 3).map(cat => (
          <span key={cat} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">{cat}</span>
        ))}
      </div>
    </div>
  </Link>
);

export default function UgcMarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch('/api/ugc/listings');
        const data = await res.json();
        setListings(data);
      } catch (error) {
        console.error('Failed to fetch UGC listings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  if (loading) return <div className="p-8">Loading UGC Marketplace...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">UGC Marketplace</h1>
        {/* Add Filter Component Here */}
      </div>

      {listings.length === 0 ? (
        <p>No UGC creators found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {listings.map((listing) => (
            <CreatorCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}


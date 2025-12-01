import React, { useState, useEffect } from 'react';

const VipCard = ({ vip }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 text-center">
    <img
      src={vip.photoUrl || 'https://via.placeholder.com/100'}
      alt={vip.name}
      className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
    />
    <h3 className="font-bold">{vip.name}</h3>
    <p className="text-sm text-blue-500">{vip.category}</p>
  </div>
);

export default function VipRosterPage() {
  const [vips, setVips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVips = async () => {
      try {
        const res = await fetch('/api/roster/vip');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Could not fetch VIP roster.');
        }
        const data = await res.json();
        setVips(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVips();
  }, []);

  if (loading) return <div className="p-8">Loading VIP Roster...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Friends of the House</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {vips.map((vip) => <VipCard key={vip.id} vip={vip} />)}
      </div>
    </div>
  );
}
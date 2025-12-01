import React, { useState, useEffect, useMemo } from 'react';

const RosterCard = ({ person }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 text-center">
    <img
      src={person.avatarUrl || person.photoUrl || 'https://via.placeholder.com/100'}
      alt={person.name}
      className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
    />
    <h3 className="font-bold">{person.name}</h3>
  </div>
);

const LockedSection = ({ title, reason }) => (
  <section className="mb-12 relative">
    <h2 className="text-2xl font-bold mb-4 capitalize">{title.replace(/([A-Z])/g, ' $1').trim()}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 blur-sm select-none">
      {/* Placeholder cards */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40"></div>
      ))}
    </div>
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
      <div className="text-center text-white p-4">
        <h3 className="font-bold text-lg">Upgrade to View</h3>
        <p className="text-sm">{reason}</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 rounded-md text-sm font-semibold">Upgrade Now</button>
      </div>
    </div>
  </section>
);

const RosterSection = ({ title, people }) => {
  if (!people) return null;

  if (people.locked) {
    return <LockedSection title={title} reason={people.reason} />;
  }

  if (people.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4 capitalize">{title.replace(/([A-Z])/g, ' $1').trim()}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {people.map((person) => (
          <RosterCard key={person.id} person={person.creator || person} />
        ))}
      </div>
    </section>
  );
};

export default function RosterPage() {
  const [fullRoster, setFullRoster] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ name: '', category: '' });

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`/api/roster?${query}`);
        const data = await res.json();
        setFullRoster(data);
      } catch (error) {
        console.error('Failed to fetch roster:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const availableCategories = Object.keys(fullRoster);

  if (loading) return <div className="p-8">Loading Roster...</div>;

  if (availableCategories.length === 0 && !loading) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Roster Access Denied</h1>
        <p>You do not have permission to view the roster.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">The Break Roster</h1>

      <div className="mb-8 sticky top-0 bg-gray-100 dark:bg-gray-900 py-4 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Search by name..."
            value={filters.name}
            onChange={handleFilterChange}
            className="p-2 border rounded-md dark:bg-gray-800"
          />
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="p-2 border rounded-md dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            <option value="EXCLUSIVE">Exclusive</option>
            <option value="TALENT">Talent</option>
            <option value="FOUNDER">Founder</option>
            <option value="UGC">UGC</option>
            <option value="VIP">VIP</option>
          </select>
        </div>
      </div>

      {Object.entries(fullRoster).map(([key, people]) => (
        <RosterSection key={key} title={key} people={people} />
      ))}
    </div>
  );
}
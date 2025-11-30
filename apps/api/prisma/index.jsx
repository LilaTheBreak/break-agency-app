import React, { useState, useEffect, useMemo } from 'react';

const RosterCard = ({ person, type }) => {
  const name = type === 'ugc' ? person.creator.name : person.name;
  const avatar = type === 'ugc' ? person.creator.avatarUrl : person.avatarUrl;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 text-center">
      <img
        src={avatar || 'https://via.placeholder.com/100'}
        alt={name}
        className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
      />
      <h3 className="font-bold">{name}</h3>
    </div>
  );
};

const RosterSection = ({ title, people, type }) => {
  if (!people || people.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4 capitalize">{title.replace('_', ' ')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {people.map((person) => (
          <RosterCard key={person.id} person={person} type={type} />
        ))}
      </div>
    </section>
  );
};

export default function RosterPage() {
  const [roster, setRoster] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const res = await fetch('/api/roster');
        const data = await res.json();
        setRoster(data);
      } catch (error) {
        console.error('Failed to fetch roster:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, []);

  const filteredRoster = useMemo(() => {
    if (!searchTerm && activeFilters.length === 0) {
      return roster;
    }

    const lowercasedSearch = searchTerm.toLowerCase();
    const newRoster = {};

    for (const key in roster) {
      if (activeFilters.length > 0 && !activeFilters.includes(key)) {
        continue;
      }

      newRoster[key] = roster[key].filter(person => {
        const name = key === 'ugc' ? person.creator.name : person.name;
        return name.toLowerCase().includes(lowercasedSearch);
      });
    }
    return newRoster;
  }, [roster, searchTerm, activeFilters]);

  const toggleFilter = (filterKey) => {
    setActiveFilters(prev =>
      prev.includes(filterKey)
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  const availableCategories = Object.keys(roster);

  if (loading) return <div className="p-8">Loading Roster...</div>;

  if (availableCategories.length === 0 && !loading) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Roster Not Available</h1>
        <p>You do not have permission to view the roster.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">The Roster</h1>

      <div className="mb-8 sticky top-0 bg-gray-100 dark:bg-gray-900 py-4 z-10">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md mb-4 dark:bg-gray-800"
        />
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(key => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`px-3 py-1 text-sm rounded-full capitalize ${
                activeFilters.includes(key)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {key.replace('_', ' ')}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button onClick={() => setActiveFilters([])} className="px-3 py-1 text-sm text-red-500">
              Clear
            </button>
          )}
        </div>
      </div>

      {Object.entries(filteredRoster).map(([key, people]) => (
        <RosterSection
          key={key}
          title={key}
          people={people}
          type={key}
        />
      ))}
    </div>
  );
}
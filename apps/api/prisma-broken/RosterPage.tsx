import React, { useState, useEffect } from 'react';
import { RosterCard } from '../components/Roster/RosterCard';

const RosterSection = ({ title, people }: { title: string, people: any[] }) => {
  if (!people || people.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6 capitalize">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {people.map(person => <RosterCard key={person.id} person={person} />)}
      </div>
    </section>
  );
};

export default function RosterPage() {
  const [roster, setRoster] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roster')
      .then(res => res.json())
      .then(setRoster)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading Roster...</div>;
  }

  if (!roster || Object.keys(roster).length === 0) {
    return <div className="p-8 text-center">You do not have access to view the roster.</div>;
  }

  return (
    <div className="p-8">
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold">Our Roster</h1>
        <p className="text-lg text-gray-500">A curated selection of top-tier talent and friends of the agency.</p>
      </header>

      <RosterSection title="VIPs & Friends of House" people={roster.vip} />
      <RosterSection title="Founders" people={roster.founders} />
      <RosterSection title="Exclusive Talent" people={roster.exclusive} />
      <RosterSection title="Talent" people={roster.talent} />
      <RosterSection title="UGC Creators" people={roster.ugc} />
    </div>
  );
}
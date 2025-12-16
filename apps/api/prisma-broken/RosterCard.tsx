import React from 'react';

export const RosterCard = ({ person }: { person: any }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
    <img src={person.avatarUrl || person.photoUrl || 'https://via.placeholder.com/150'} alt={person.name} className="w-24 h-24 rounded-full mx-auto mb-2" />
    <h4 className="font-bold">{person.name}</h4>
    <p className="text-xs text-gray-500">{person.bio || (person.categories || []).join(', ')}</p>
  </div>
);

export const VIPCard = ({ person }: { person: any }) => (
  // Can be a different component or share the same one
  <RosterCard person={person} />
);
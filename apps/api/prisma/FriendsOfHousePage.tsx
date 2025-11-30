import React, { useState, useEffect } from 'react';

export default function FriendsOfHousePage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', bio: '' });

  useEffect(() => {
    fetch('/api/friends-of-house').then(res => res.json()).then(setFriends);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/friends-of-house', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    // Refetch and clear form
    fetch('/api/friends-of-house').then(res => res.json()).then(setFriends);
    setFormData({ name: '', bio: '' });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Manage Friends of House</h1>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1">
          <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold">Add New Friend</h2>
            <div>
              <label className="text-xs">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md text-sm dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="text-xs">Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-2 border rounded-md text-sm dark:bg-gray-700"
              />
            </div>
            <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
              Add Friend
            </button>
          </form>
        </div>
        <div className="col-span-2">
          <table className="w-full text-left bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-3">Name</th>
                <th className="p-3">Bio</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {friends.map(friend => (
                <tr key={friend.id} className="border-b dark:border-gray-700">
                  <td className="p-3">{friend.name}</td>
                  <td className="p-3 text-sm">{friend.bio}</td>
                  <td className="p-3"><button className="text-xs text-red-500">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
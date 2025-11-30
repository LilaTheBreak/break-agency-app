import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function AdminUserEditPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rosterCategory, setRosterCategory] = useState('');
  const [includeInRoster, setIncludeInRoster] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // This endpoint needs to exist and be admin-protected
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();
        setUser(data);
        setRosterCategory(data.roster_category || 'NONE');
        setIncludeInRoster(data.include_in_roster || false);
      } catch (error) {
        console.error('Failed to fetch user', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roster_category: rosterCategory,
          include_in_roster: includeInRoster,
        }),
      });
      alert('User updated successfully!');
    } catch (error) {
      console.error('Failed to update user', error);
      alert('Update failed. See console for details.');
    }
  };

  if (loading) return <div className="p-8">Loading user...</div>;
  if (!user) return <div className="p-8">User not found.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit User: {user.name}</h1>
      <form onSubmit={handleSave} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Roster Settings</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="includeInRoster" className="font-medium">Include in Public Roster</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="includeInRoster"
                checked={includeInRoster}
                onChange={(e) => setIncludeInRoster(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="rosterCategory" className="block mb-2 text-sm font-medium">Roster Category</label>
          <select
            id="rosterCategory"
            value={rosterCategory}
            onChange={(e) => setRosterCategory(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700"
          >
            <option value="NONE">None</option>
            <option value="EXCLUSIVE">Exclusive</option>
            <option value="TALENT">Talent</option>
            <option value="FOUNDER">Founder</option>
            <option value="VIP">VIP</option>
            <option value="UGC">UGC</option>
          </select>
        </div>

        <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Save Changes
        </button>
      </form>
    </div>
  );
}
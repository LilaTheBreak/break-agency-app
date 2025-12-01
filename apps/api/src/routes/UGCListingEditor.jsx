import React, { useState, useEffect } from 'react';

export default function UGCListingEditor() {
  const [formData, setFormData] = useState({
    bio: '',
    categories: [],
    portfolio: [],
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing listing data on load
  useEffect(() => {
    // fetch('/api/ugc/listings/mine').then(res => res.json()).then(setFormData);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/ugc/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      alert('Listing saved!');
    } catch (error) {
      alert('Failed to save listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Your UGC Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Your Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full p-2 border rounded-md" rows="4" />
        </div>
        <div>
          <label className="text-sm font-medium">Categories (comma-separated)</label>
          <input name="categories" value={formData.categories.join(', ')} onChange={(e) => setFormData({...formData, categories: e.target.value.split(',').map(c => c.trim())})} className="w-full p-2 border rounded-md" />
        </div>
        {/* Add fields for portfolio links, deliverables, pricing, etc. */}
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Saving...' : 'Save Listing'}
        </button>
      </form>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewCampaignPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goals: '',
    categories: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categories: formData.categories.split(',').map(c => c.trim()),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit campaign.');
      }
      alert('Campaign submitted successfully!');
      navigate('/brand/campaigns');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Submit a New Campaign</h1>
      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Campaign Title</label>
          <input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md" required />
        </div>
        <div>
          <label className="text-sm font-medium">Campaign Description & Goals</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md" rows="5" required />
        </div>
        <div>
          <label className="text-sm font-medium">Target Categories (comma-separated)</label>
          <input name="categories" value={formData.categories} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="e.g., fashion, lifestyle" required />
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400">
          {loading ? 'Submitting...' : 'Submit Campaign'}
        </button>
      </form>
    </div>
  );
}
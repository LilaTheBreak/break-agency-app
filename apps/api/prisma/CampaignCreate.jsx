import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CampaignCreatePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [],
    budgetMin: 1000,
    budgetMax: 5000,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/brand-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categories: formData.categories.split(',').map(c => c.trim()),
        }),
      });
      if (!res.ok) throw new Error('Failed to create campaign.');
      const newCampaign = await res.json();
      alert('Campaign submitted for analysis!');
      navigate(`/brand/campaigns/${newCampaign.id}`);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Campaign Title</label>
          <input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-md" required />
        </div>
        <div>
          <label className="text-sm font-medium">Campaign Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md" rows="4" required />
        </div>
        <div>
          <label className="text-sm font-medium">Target Categories (comma-separated)</label>
          <input name="categories" value={formData.categories} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="e.g., fashion, lifestyle" required />
        </div>
        {/* Add fields for budget, platforms, etc. */}
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Submitting for AI Analysis...' : 'Submit Campaign'}
        </button>
      </form>
    </div>
  );
}
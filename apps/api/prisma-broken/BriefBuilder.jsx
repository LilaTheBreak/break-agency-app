import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BriefBuilder() {
  const [formData, setFormData] = useState({
    goal: 'awareness',
    platforms: ['tiktok'],
    budgetMin: 500,
    budgetMax: 2000,
    productDetails: '',
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
      const res = await fetch('/api/briefs/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.status === 402) {
        throw new Error('This feature requires a Premium subscription. Please upgrade your plan.');
      }
      if (!res.ok) {
        throw new Error('Failed to generate brief.');
      }

      const generatedBrief = await res.json();
      navigate(`/briefs/${generatedBrief.briefId}`, { state: { brief: generatedBrief } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Campaign Brief Builder</h1>
      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Main Campaign Goal</label>
          <select name="goal" value={formData.goal} onChange={handleChange} className="w-full p-2 border rounded-md">
            <option value="awareness">Brand Awareness</option>
            <option value="sales">Direct Sales</option>
            <option value="ugc">Generate UGC</option>
            <option value="launch">Product Launch</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Product/Service Details</label>
          <textarea
            name="productDetails"
            value={formData.productDetails}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            placeholder="Describe your product, its key features, and target audience."
            rows="5"
            required
          />
        </div>
        {/* Add more fields for platforms, budget, etc. */}
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Generating Brief...' : 'Generate with AI'}
        </button>
      </form>
    </div>
  );
}
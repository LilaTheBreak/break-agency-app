import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient.js';

export default function UgcApplyPage() {
  const [formData, setFormData] = useState({
    bio: '',
    categories: '',
    portfolioUrl: '',
    sampleLinks: [],
    rates: {},
  });
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch existing application to pre-fill form
    apiFetch('/api/ugc/application/my')
      .then(res => res.ok && res.json())
      .then(data => {
        if (data) {
          setApplication(data);
          setFormData({ ...data, categories: data.categories.join(', ') });
        }
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/ugc/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categories: formData.categories.split(',').map(c => c.trim()),
        }),
      });
      if (!res.ok) throw new Error('Failed to submit application.');
      alert('Application submitted for review!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (application?.status === 'approved') {
    return <div className="p-8 text-center">Your UGC application has been approved!</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Apply for the UGC Marketplace</h1>
      {application?.status === 'pending' && <div className="p-4 mb-4 text-yellow-700 bg-yellow-100 rounded-lg">Your application is currently under review.</div>}
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Your Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full p-2 border rounded-md" rows="4" />
        </div>
        <div>
          <label className="text-sm font-medium">Portfolio URL (e.g., your website, linktr.ee)</label>
          <input name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} className="w-full p-2 border rounded-md" />
        </div>
        <div>
          <label className="text-sm font-medium">Content Categories (comma-separated)</label>
          <input name="categories" value={formData.categories} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="e.g., beauty, tech, lifestyle" />
        </div>
        <button type="submit" disabled={loading || application?.status === 'pending'} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400">
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}


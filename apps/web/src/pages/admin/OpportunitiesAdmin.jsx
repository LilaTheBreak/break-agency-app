import React, { useState, useEffect } from 'react';
import { isFeatureEnabled } from '../../config/features.js';
import { ComingSoon } from '../../components/ComingSoon.jsx';

export function OpportunitiesAdmin() {
  // Gate this feature - opportunities API is not yet fully wired
  if (!isFeatureEnabled('BRAND_OPPORTUNITIES_ENABLED')) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <ComingSoon
          feature="BRAND_OPPORTUNITIES_ENABLED"
          title="Opportunities Marketplace"
          description="Post briefs and get matched with creators based on AI-powered fit analysis"
        />
      </div>
    );
  }
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    location: '',
    title: '',
    deliverables: '',
    payment: '',
    deadline: '',
    status: 'Live brief · Login required to apply',
    image: '',
    logo: '',
    type: '',
    isActive: true
  });

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/opportunities/${editingId}` : '/api/opportunities';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchOpportunities();
        resetForm();
      } else {
        alert('Failed to save opportunity');
      }
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Error saving opportunity');
    }
  };

  const handleEdit = (opportunity) => {
    setFormData({
      brand: opportunity.brand,
      location: opportunity.location,
      title: opportunity.title,
      deliverables: opportunity.deliverables,
      payment: opportunity.payment,
      deadline: opportunity.deadline,
      status: opportunity.status,
      image: opportunity.image,
      logo: opportunity.logo,
      type: opportunity.type,
      isActive: opportunity.isActive
    });
    setEditingId(opportunity.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchOpportunities();
      } else {
        alert('Failed to delete opportunity');
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Error deleting opportunity');
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      location: '',
      title: '',
      deliverables: '',
      payment: '',
      deadline: '',
      status: 'Live brief · Login required to apply',
      image: '',
      logo: '',
      type: '',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Opportunities Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add New Opportunity'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {editingId ? 'Edit Opportunity' : 'Create New Opportunity'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Brand Name</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Luxury travel, Fintech"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Deadline</label>
                <input
                  type="text"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Feb 28"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Deliverables</label>
                <input
                  type="text"
                  name="deliverables"
                  value={formData.deliverables}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 4 IG Reels • 2 Editorial Posts"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Payment</label>
                <input
                  type="text"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  required
                  placeholder="e.g., €8K – €12K + travel"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <input
                type="text"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  placeholder="https://..."
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Logo URL</label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  required
                  placeholder="https://..."
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active (visible on public page)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
              >
                {editingId ? 'Update' : 'Create'} Opportunity
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-6 py-2 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {opportunities.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
            No opportunities yet. Create your first one!
          </div>
        ) : (
          opportunities.map((opp) => (
            <div
              key={opp.id}
              className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
              <img
                src={opp.logo}
                alt={opp.brand}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="mb-1 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{opp.brand}</h3>
                    <p className="text-sm text-slate-600">{opp.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        opp.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>📍 {opp.location}</span>
                  <span>💼 {opp.type}</span>
                  <span>💰 {opp.payment}</span>
                  <span>📅 {opp.deadline}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(opp)}
                    className="rounded bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(opp.id)}
                    className="rounded bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

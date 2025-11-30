import React, { useState } from 'react';

export default function BrandCampaignCreate() {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const campaignData = { title, objective, budgetMin: parseFloat(budgetMin), budgetMax: parseFloat(budgetMax), status: 'draft' };

    const res = await fetch('/api/brand/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData),
    });
    if (res.ok) {
      const newCampaign = await res.json();
      // Redirect to the new campaign's talent selection page
      window.location.href = `/brand/campaign/${newCampaign.id}/select-creators`;
    } else {
      alert('Failed to create campaign.');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Build Your Campaign Brief</h1>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Campaign Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700"
            placeholder="e.g., Summer Skincare Launch"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Campaign Objective</label>
          <textarea
            value={objective}
            onChange={e => setObjective(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700"
            placeholder="Describe the main goal of your campaign. What do you want to achieve?"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Minimum Budget (£)</label>
            <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700" placeholder="e.g., 500" />
          </div>
          <div>
            <label className="text-sm font-medium">Maximum Budget (£)</label>
            <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700" placeholder="e.g., 2000" />
          </div>
        </div>

        {/* 
          This is where you would add fields for deliverables, target audience, etc.
          For premium users, you could show more advanced options.
        */}
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Saving...' : 'Save & Select Creators'}
        </button>
      </form>
    </div>
  );
}
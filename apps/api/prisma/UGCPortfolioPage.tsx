import React, { useState, useEffect } from 'react';

export default function UGCPortfolioPage() {
  const [portfolio, setPortfolio] = useState({ bio: '', categories: [], sampleLinks: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ugc/portfolio/me')
      .then(res => res.json())
      .then(data => {
        if (data) setPortfolio(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/ugc/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolio),
    });
    setLoading(false);
    alert('Portfolio saved!');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My UGC Portfolio</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Your Bio</label>
          <textarea
            value={portfolio.bio}
            onChange={e => setPortfolio({ ...portfolio, bio: e.target.value })}
            className="w-full p-2 border rounded-md dark:bg-gray-700"
            placeholder="Tell brands what makes your content special..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Categories (comma-separated)</label>
          <input
            type="text"
            value={portfolio.categories.join(', ')}
            onChange={e => setPortfolio({ ...portfolio, categories: e.target.value.split(',').map(c => c.trim()) })}
            className="w-full p-2 border rounded-md dark:bg-gray-700"
            placeholder="e.g., skincare, fashion, tech"
          />
        </div>
        {/* Add inputs for sampleLinks and photo uploads here */}
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Saving...' : 'Save Portfolio'}
        </button>
      </form>
    </div>
  );
}
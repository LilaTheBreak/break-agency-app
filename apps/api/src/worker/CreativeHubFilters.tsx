import React from 'react';

export default function CreativeHubFilters({ filters, setFilters }) {
  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium">Asset Type</label>
          <select name="assetType" value={filters.assetType} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-gray-700">
            <option value="">All</option>
            <option value="caption">Caption</option>
            <option value="hook">Hook</option>
            <option value="script">Script</option>
            <option value="prompt">Image Prompt</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Platform</label>
          <select name="platform" value={filters.platform} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-gray-700">
            <option value="">All</option>
            <option value="TIKTOK">TikTok</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
          </select>
        </div>
        {/* Add more filters for talent, brand, etc. */}
      </div>
    </aside>
  );
}
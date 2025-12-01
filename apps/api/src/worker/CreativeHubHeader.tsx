import React from 'react';

export default function CreativeHubHeader({ filters, setFilters }) {
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, keyword: e.target.value }));
  };

  return (
    <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Creative Hub</h1>
      <div className="w-1/2">
        <input
          type="search"
          placeholder="Search all creative assets..."
          value={filters.keyword}
          onChange={handleSearchChange}
          className="w-full p-2 border rounded-md dark:bg-gray-700"
        />
      </div>
    </header>
  );
}
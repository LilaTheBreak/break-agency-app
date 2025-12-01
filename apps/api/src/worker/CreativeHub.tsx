import React, { useState, useEffect } from 'react';
import CreativeHubHeader from '../../components/creative-hub/CreativeHubHeader';
import CreativeHubFilters from '../../components/creative-hub/CreativeHubFilters';
import CreativeGrid from '../../components/creative-hub/CreativeGrid';
import CreativeHubEmptyState from '../../components/creative-hub/CreativeHubEmptyState';

export default function CreativeHubPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    assetType: '',
    platform: '',
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/creative-hub/search?${query}`);
      if (!res.ok) throw new Error('Failed to fetch assets.');
      const data = await res.json();
      setAssets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAssets();
    }, 500); // Debounce search to avoid excessive API calls

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <CreativeHubFilters filters={filters} setFilters={setFilters} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <CreativeHubHeader filters={filters} setFilters={setFilters} />

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p>Loading assets...</p>
          ) : assets.length > 0 ? (
            <CreativeGrid assets={assets} />
          ) : (
            <CreativeHubEmptyState onClearFilters={() => setFilters({ keyword: '', assetType: '', platform: '' })} />
          )}
        </div>
      </main>
    </div>
  );
}
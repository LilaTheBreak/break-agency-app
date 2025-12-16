import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const BundleCard = ({ bundle }) => {
  const isLocked = bundle.locked;

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${isLocked ? 'border-gray-300' : 'border-blue-500'}`}>
      <h3 className="text-2xl font-bold">{bundle.type} Bundle</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">{bundle.aiSummary}</p>

      <div className={`relative ${isLocked ? 'blur-sm select-none' : ''}`}>
        <div className="grid grid-cols-2 gap-4 text-center text-sm mb-4">
          <div>
            <p className="font-semibold">Est. Budget</p>
            <p className="text-lg font-bold">{isLocked ? '$??,???' : `$${bundle.budget?.estimated}`}</p>
          </div>
          <div>
            <p className="font-semibold">Est. Views</p>
            <p className="text-lg font-bold">{isLocked ? '??.?' : `${(bundle.forecast?.predictedViews / 1000).toFixed(1)}k`}</p>
          </div>
        </div>

        <h4 className="text-md font-semibold mb-2">Creators in this Bundle:</h4>
        <div className="flex -space-x-2">
          {isLocked ? (
            [...Array(3)].map((_, i) => <div key={i} className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white"></div>)
          ) : (
            bundle.creators.map(c => (
              <img key={c.userId} src={c.user.avatarUrl} alt={c.user.name} className="w-10 h-10 rounded-full border-2 border-white" />
            ))
          )}
        </div>
      </div>

      {isLocked ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold">Upgrade to Unlock</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-right">
          <button className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md">
            Activate this Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default function BriefBundlesPage() {
  const { id } = useParams();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        // First, trigger generation (in a real app, this might be a separate user action)
        await fetch(`/api/ai/bundles/generate/${id}`, { method: 'POST' });

        // Then, fetch the results
        const res = await fetch(`/api/brand/briefs/${id}/bundles`);
        const data = await res.json();
        setBundles(data);
      } catch (error) {
        console.error('Failed to fetch bundles', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBundles();
  }, [id]);

  if (loading) return <div className="p-8">Generating AI Creator Bundles...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">AI Creator Bundles</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {bundles.length > 0 ? (
          bundles.map(bundle => <BundleCard key={bundle.id} bundle={bundle} />)
        ) : (
          <p>Could not generate bundles for this brief. Please check the brief details and try again.</p>
        )}
      </div>
    </div>
  );
}
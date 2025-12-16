import React, { useState, useEffect } from 'react';
import HashtagClusters from './HashtagClusters';

interface HashtagPreviewProps {
  deliverableId: string;
}

export default function HashtagPreview({ deliverableId }: HashtagPreviewProps) {
  const [hashtagSet, setHashtagSet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHashtags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hashtags/${deliverableId}`);
      if (res.ok) {
        const data = await res.json();
        setHashtagSet(data[0]); // Get the latest set
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/hashtags/generate/${deliverableId}`, { method: 'POST' });
    setTimeout(fetchHashtags, 3000); // Poll for results
  };

  useEffect(() => {
    fetchHashtags();
  }, [deliverableId]);

  if (loading) return <div className="p-4">Loading Hashtags...</div>;

  if (!hashtagSet) {
    return (
      <div className="p-4 text-center">
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Generate Hashtags with AI</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <HashtagClusters clusters={hashtagSet.clusters} difficultyMap={hashtagSet.difficultyMap} />
    </div>
  );
}
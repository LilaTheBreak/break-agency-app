import React, { useState, useEffect } from 'react';
import FrameGallery from './FrameGallery';

interface StoryboardViewerProps {
  deliverableId: string;
}

export default function StoryboardViewer({ deliverableId }: StoryboardViewerProps) {
  const [storyboard, setStoryboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStoryboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/storyboard/${deliverableId}`);
      if (!res.ok) {
        throw new Error('No storyboard found. Please generate one.');
      }
      setStoryboard(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/storyboard/generate/${deliverableId}`, { method: 'POST' });
    // Poll for results
    setTimeout(fetchStoryboard, 5000); // Simple polling
  };

  useEffect(() => {
    fetchStoryboard();
  }, [deliverableId]);

  if (loading) return <div className="p-6">Loading Storyboard...</div>;

  if (error || !storyboard) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">{error || 'No storyboard available.'}</p>
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate Storyboard with AI
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">AI-Generated Storyboard</h2>
        <button onClick={handleGenerate} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-md">
          Regenerate
        </button>
      </div>
      <FrameGallery frames={storyboard.frames} />
    </div>
  );
}
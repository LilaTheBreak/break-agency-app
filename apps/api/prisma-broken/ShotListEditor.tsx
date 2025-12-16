import React, { useState, useEffect } from 'react';

interface EditorProps {
  conceptId: string;
}

const ShotCard = ({ shot }: { shot: any }) => (
  <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
    <p className="text-sm font-bold mb-2">
      <span className="text-blue-500">Shot {shot.shotNumber}</span> - {shot.shotType}
    </p>
    <p className="text-sm mb-3">{shot.description}</p>
    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <p><strong>Angle:</strong> {shot.cameraAngle}</p>
      <p><strong>Lighting:</strong> {shot.lighting}</p>
      {shot.props?.length > 0 && <p><strong>Props:</strong> {shot.props.join(', ')}</p>}
    </div>
  </div>
);

export default function ShotListEditor({ conceptId }: EditorProps) {
  const [shots, setShots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conceptId) return;
    fetch(`/api/concepts/${conceptId}/shotlist`)
      .then(res => res.json())
      .then(setShots);
  }, [conceptId]);

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/concepts/${conceptId}/shotlist/generate`, { method: 'POST' });
    setTimeout(() => {
      fetch(`/api/concepts/${conceptId}/shotlist`).then(res => res.json()).then(setShots);
      setLoading(false);
    }, 3000); // Poll for results
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <header className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">AI Storyboard & Shot List</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md"
        >
          {loading ? 'Generating...' : 'Generate Shot List'}
        </button>
      </header>

      {loading && shots.length === 0 ? (
        <p className="text-center py-8">AI is building the storyboard...</p>
      ) : shots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shots.map(shot => <ShotCard key={shot.id} shot={shot} />)}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 py-8">
          No shot list has been generated for this concept yet.
        </p>
      )}
    </div>
  );
}
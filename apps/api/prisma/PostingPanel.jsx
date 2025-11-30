import React, { useState, useEffect } from 'react';

export default function PostingPanel({ deliverable }) {
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState(deliverable.aiCaptionDrafts?.captions || []);
  const [selectedCaption, setSelectedCaption] = useState('');

  const handleGenerateCaptions = async () => {
    setLoading(true);
    const res = await fetch(`/api/deliverables/${deliverable.id}/ai/generate-captions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: deliverable.description }),
    });
    const data = await res.json();
    setCaptions(data.captions);
    setLoading(false);
  };

  const handleQueuePost = async () => {
    if (!selectedCaption) {
      alert('Please select a caption first.');
      return;
    }
    setLoading(true);
    await fetch(`/api/deliverables/${deliverable.id}/post/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'tiktok', // This would be dynamic
        payload: { caption: selectedCaption, mediaUrl: deliverable.fileUrl },
      }),
    });
    alert('Post has been queued!');
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Posting Assistant</h2>
        <button onClick={handleGenerateCaptions} disabled={loading} className="px-4 py-2 text-sm font-medium border rounded-md">
          {loading ? 'Generating...' : 'Generate Captions'}
        </button>
      </header>

      {captions.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">Select a Caption:</h3>
          {captions.map((caption, i) => (
            <div
              key={i}
              onClick={() => setSelectedCaption(caption)}
              className={`p-3 rounded-md cursor-pointer text-sm ${selectedCaption === caption ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 border-2' : 'bg-gray-50 dark:bg-gray-700'}`}
            >
              {caption}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={handleQueuePost} disabled={loading || !selectedCaption} className="flex-1 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400">
          Queue Post
        </button>
        <button disabled={loading} className="flex-1 px-4 py-2 font-semibold text-white bg-green-600 rounded-md disabled:bg-gray-400">
          Post Now
        </button>
      </div>
    </div>
  );
}
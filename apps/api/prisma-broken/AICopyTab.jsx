import React, { useState, useEffect } from 'react';

const EditableField = ({ label, value, onChange, isTextarea = false }) => (
  <div>
    <label className="text-sm font-medium text-gray-500">{label}</label>
    {isTextarea ? (
      <textarea
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
        rows="6"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
      />
    )}
  </div>
);

export default function AICopyTab({ deliverableId }) {
  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCopy = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/copy/${deliverableId}`);
      if (!res.ok) {
        // If no copy exists, generate it for the first time
        const genRes = await fetch(`/api/copy/generate/${deliverableId}`, { method: 'POST' });
        if (!genRes.ok) throw new Error('Failed to generate copy.');
        const genData = await genRes.json();
        setCopy(genData);
      } else {
        const data = await res.json();
        setCopy(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopy();
  }, [deliverableId]);

  const handleUpdate = (field, value) => {
    setCopy(prev => ({ ...prev, [field]: value }));
    // Add a debounce here to auto-save after user stops typing
  };

  const handleSave = async () => {
    await fetch(`/api/copy/${copy.id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(copy),
    });
    alert('Saved!');
  };

  if (loading) return <div className="p-4">Loading AI Copywriter...</div>;
  if (!copy) return <div className="p-4">Could not load copy.</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">AI Copy & Script</h3>
        <div>
          <button onClick={fetchCopy} className="px-3 py-1.5 mr-2 text-sm font-semibold bg-gray-200 rounded-md">Regenerate</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md">Save</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <EditableField
            label="Short Caption (e.g., for Reels/TikTok)"
            value={copy.shortCaption}
            onChange={(e) => handleUpdate('shortCaption', e.target.value)}
            isTextarea
          />
          <EditableField
            label="Long Caption (e.g., for Instagram Post)"
            value={copy.longCaption}
            onChange={(e) => handleUpdate('longCaption', e.target.value)}
            isTextarea
          />
        </div>
        <div className="space-y-4">
          <EditableField
            label="Full Script"
            value={copy.fullScript}
            onChange={(e) => handleUpdate('fullScript', e.target.value)}
            isTextarea
          />
        </div>
      </div>
    </div>
  );
}
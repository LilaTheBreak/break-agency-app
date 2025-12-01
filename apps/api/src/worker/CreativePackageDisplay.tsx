import React, { useState, useEffect } from 'react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xl font-bold border-b pb-2 mb-4">{title}</h3>
    {children}
  </div>
);

export default function CreativePackageDisplay({ deliverableId }) {
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/creative/output/${deliverableId}`);
      if (!res.ok) {
        throw new Error('No creative package found. Please generate one.');
      }
      setPkg(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    await fetch(`/api/creative/generate/${deliverableId}`, { method: 'POST' });
    // Poll for results
    setTimeout(fetchPackage, 3000); // Simple polling
  };

  useEffect(() => {
    fetchPackage();
  }, [deliverableId]);

  if (loading) return <div className="p-6">Loading Creative Package...</div>;

  if (error || !pkg) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">{error || 'No creative package available.'}</p>
        <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Generate with AI
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Creative Package</h2>
        <button onClick={handleGenerate} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-md">
          Regenerate
        </button>
      </div>

      <Section title="Core Concepts">
        {pkg.concepts.map((c, i) => (
          <div key={i} className="mb-2">
            <p className="font-semibold">{c.title}</p>
            <p className="text-sm text-gray-600">{c.description}</p>
          </div>
        ))}
      </Section>

      <Section title="Hooks & Captions">
        <p className="text-sm"><strong className="font-semibold">Hooks:</strong> {pkg.hooks.join(' | ')}</p>
        <p className="text-sm mt-2"><strong className="font-semibold">Short Caption:</strong> {pkg.captions.short}</p>
      </Section>

      {/* Add other components like ScriptOutline, Shotlist, etc. here */}
    </div>
  );
}
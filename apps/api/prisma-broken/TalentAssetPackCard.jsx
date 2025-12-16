import React, { useState, useEffect } from 'react';

export default function TalentAssetPackCard({ aiPlanId, talentId }) {
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aiPlanId || !talentId) return;
    setLoading(true);
    // Poll for results
    const interval = setInterval(() => {
      fetch(`/api/asset-pack/${aiPlanId}/${talentId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setPack(data);
            setLoading(false);
            clearInterval(interval);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [aiPlanId, talentId]);

  if (loading) return <div className="p-4 text-center text-sm">Generating asset pack...</div>;
  if (!pack) return null;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="mb-4">
        <h3 className="font-bold text-xl">Creator Export Kit</h3>
        <p className="text-sm text-gray-500">All assets for {pack.brandName}, ready for the creator.</p>
      </header>

      <div className="space-y-3">
        <a href={pack.zipUrl} className="block w-full text-center p-3 font-semibold text-white bg-blue-600 rounded-md">
          Download Full Asset Pack (.zip)
        </a>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <a href={pack.briefPdf} className="block p-2 text-center border rounded-md">Brief.pdf</a>
          <a href={pack.guidelinesPdf} className="block p-2 text-center border rounded-md">Guidelines.pdf</a>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 text-xs px-3 py-1.5 border rounded-md">Regenerate</button>
        <button className="flex-1 text-xs px-3 py-1.5 border rounded-md">Send to Talent</button>
      </div>
    </div>
  );
}
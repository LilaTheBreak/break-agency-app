import React, { useState, useEffect } from 'react';

interface EditorProps {
  deliverableId: string;
}

const PlatformTabs = ({ active, setActive }: { active: string, setActive: (p: string) => void }) => {
  const platforms = ['TikTok', 'Instagram', 'LinkedIn', 'X'];
  return (
    <div className="flex border-b dark:border-gray-700">
      {platforms.map(p => (
        <button
          key={p}
          onClick={() => setActive(p)}
          className={`px-4 py-2 text-sm font-medium ${active === p ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
};

const RewriteVariant = ({ rewrite }: { rewrite: any }) => (
  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <p className="text-xs font-semibold">{rewrite.platform} - {rewrite.tone}</p>
      <p className="text-lg font-bold text-blue-500">{rewrite.score}/100</p>
    </div>
    <p className="text-sm">{rewrite.rewrittenCaption}</p>
  </div>
);

export default function CaptionRewriteEditor({ deliverableId }: EditorProps) {
  const [rewrites, setRewrites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('TikTok');
  const [tone, setTone] = useState('Witty & Engaging');

  useEffect(() => {
    if (!deliverableId) return;
    fetch(`/api/deliverables/${deliverableId}/captions`)
      .then(res => res.json())
      .then(setRewrites);
  }, [deliverableId]);

  const handleRewrite = async () => {
    setLoading(true);
    await fetch(`/api/deliverables/${deliverableId}/captions/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        options: { tone, style: 'Short & Punchy', keywords: [] },
      }),
    });
    setTimeout(() => {
      fetch(`/api/deliverables/${deliverableId}/captions`).then(res => res.json()).then(setRewrites);
      setLoading(false);
    }, 3000); // Poll for results
  };

  const platformRewrites = rewrites.filter(r => r.platform === platform);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Caption Rewriter</h2>
        <p className="text-sm text-gray-500">Optimize your caption for different platforms and tones.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold">Options</h3>
          <div>
            <label className="text-xs">Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700">
              <option>Witty & Engaging</option>
              <option>Professional & Informative</option>
              <option>Casual & Fun</option>
            </select>
          </div>
          <button onClick={handleRewrite} disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
            {loading ? 'AI is Writing...' : `Rewrite for ${platform}`}
          </button>
        </div>
        <div className="md:col-span-2">
          <PlatformTabs active={platform} setActive={setPlatform} />
          <div className="pt-4 space-y-3">
            {platformRewrites.map(rewrite => <RewriteVariant key={rewrite.id} rewrite={rewrite} />)}
            {platformRewrites.length === 0 && <p className="text-sm text-center text-gray-500 py-8">No rewrites for this platform yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
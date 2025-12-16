import React, { useState } from 'react';

const ResultCard = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    {children}
  </div>
);

export default function ContentOptimiserPage() {
  const [formData, setFormData] = useState({
    platform: 'TIKTOK',
    caption: '',
    hook: '',
    thumbnailUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Analysis failed. Please try again.');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">AI Content Optimiser</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">Analyze Your Post</h2>
            <div>
              <label className="text-sm font-medium">Platform</label>
              <select name="platform" value={formData.platform} onChange={handleChange} className="w-full p-2 border rounded-md">
                <option value="TIKTOK">TikTok</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Hook (First 3 seconds)</label>
              <input name="hook" value={formData.hook} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="e.g., You're using this app wrong..." />
            </div>
            <div>
              <label className="text-sm font-medium">Caption</label>
              <textarea name="caption" value={formData.caption} onChange={handleChange} className="w-full p-2 border rounded-md" rows="5" />
            </div>
            <div>
              <label className="text-sm font-medium">Thumbnail URL (Optional)</label>
              <input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="https://..." />
            </div>
            <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
              {loading ? 'Analyzing...' : 'Optimize My Content'}
            </button>
          </form>
        </div>

        {/* Results Display */}
        <div className="lg:col-span-2">
          {loading && <p>AI is analyzing your content...</p>}
          {error && <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
          {result && (
            <div className="space-y-6">
              <ResultCard title="Performance Prediction">
                <p className="text-2xl font-bold">{result.postPredictions.viralityScore * 100}% Virality Score</p>
                <p>Views: {result.postPredictions.predictedViews.min} - {result.postPredictions.predictedViews.max}</p>
                <p className="text-sm mt-2">{result.postPredictions.summary}</p>
              </ResultCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultCard title="Hook Score">
                  <p className="text-4xl font-bold text-center">{result.aiScores.hookScore}/100</p>
                  <p className="text-sm mt-2">{result.aiFixes.hookSuggestions[0]}</p>
                </ResultCard>

                <ResultCard title="Thumbnail Grade">
                  <p className="text-4xl font-bold text-center">{result.aiScores.thumbnailGrade}</p>
                  <p className="text-sm mt-2">{result.aiFixes.thumbnailSuggestions[0]}</p>
                </ResultCard>
              </div>

              <ResultCard title="Rewritten Captions">
                <ul className="space-y-2">
                  {result.aiFixes.rewrittenCaptions.map(variant => (
                    <li key={variant.style} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <strong className="capitalize">{variant.style}:</strong> {variant.text}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
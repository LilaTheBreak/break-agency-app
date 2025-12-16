import React, { useState, useEffect } from 'react';

const ActionItem = ({ item }) => (
  <div className="p-3 border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
    <p className="font-semibold text-sm">{item.action}</p>
    <p className="text-xs text-gray-500">{item.context}</p>
  </div>
);

export default function DailyDigestWidget() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/inbox-summary/daily')
      .then(res => res.json())
      .then(setDigest)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center">Loading your daily digest...</div>;
  if (!digest) return null;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="mb-4">
        <h2 className="text-2xl font-bold">Your Daily Digest</h2>
        <p className="text-sm text-gray-500">An AI-powered summary of your inbox.</p>
      </header>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">AI Summary</h3>
        <p className="text-sm mt-1">{digest.summary}</p>
      </div>

      <div>
        <h3 className="font-bold mb-2">Top Actions for Today</h3>
        <div className="border dark:border-gray-700 rounded-md">
          {(digest.actions || []).length > 0 ? (
            (digest.actions || []).map((item, i) => <ActionItem key={i} item={item} />)
          ) : (
            <p className="p-3 text-sm text-gray-500">No urgent actions found.</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold text-sm mb-2">Insights</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {(digest.insights || []).map((insight, i) => <li key={i}>{insight}</li>)}
        </ul>
      </div>
    </div>
  );
}
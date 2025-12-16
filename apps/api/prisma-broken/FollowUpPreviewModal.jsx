import React, { useState, useEffect } from 'react';

export default function FollowUpPreviewModal({ threadId, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the AI-generated content here
    setLoading(true);
    setTimeout(() => {
      setSubject('Re: Following up on our conversation');
      setBody('Hi team,\n\nJust wanted to gently follow up on my previous email. Let me know if you have any questions!\n\nBest,\nAgent');
      setLoading(false);
    }, 1000);
  }, [threadId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl">
        <header className="p-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-lg">Preview Follow-Up</h2>
        </header>
        <main className="p-4 space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full p-2 h-48 border rounded-md dark:bg-gray-900 dark:border-gray-600" />
            </>
          )}
        </main>
        <footer className="p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white font-semibold">Send Now</button>
        </footer>
      </div>
    </div>
  );
}
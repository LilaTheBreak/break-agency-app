import React, { useState, useEffect } from 'react';

const OutboxItem = ({ email }) => (
  <div className="p-3 border-b dark:border-gray-700">
    <div className="flex justify-between">
      <p className="font-semibold">{email.subject}</p>
      <span className={`px-2 py-0.5 text-xs rounded-full ${email.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {email.status}
      </span>
    </div>
    <p className="text-sm text-gray-500">To: {email.to}</p>
    {email.error && <p className="text-xs text-red-500 mt-1">Error: {email.error}</p>}
  </div>
);

export default function EmailOutboxView() {
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/email/outbox')
      .then(res => res.json())
      .then(setOutbox)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Email Outbox</h2>
        <button className="px-3 py-1 text-sm border rounded-md">Refresh</button>
      </header>

      {loading ? (
        <p>Loading outbox...</p>
      ) : (
        <div className="space-y-2">
          {outbox.length > 0 ? (
            outbox.map(email => <OutboxItem key={email.id} email={email} />)
          ) : (
            <p className="text-sm text-gray-500">The outbox is empty.</p>
          )}
        </div>
      )}
    </div>
  );
}
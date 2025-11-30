import React, { useState, useEffect } from 'react';

async function fetchAccounts() {
  const res = await fetch('/api/inbox/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

async function selectAccount(inboxId) {
  await fetch('/api/inbox/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inboxId }),
  });
  window.location.reload(); // Refresh to apply the new inbox context
}

export default function InboxSwitcher() {
  const [accounts, setAccounts] = useState({ myInbox: null, talents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts()
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>;
  }

  return (
    <div className="flex items-center gap-4">
      <select
        onChange={(e) => selectAccount(e.target.value)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-medium"
      >
        {accounts.myInbox && <option value={accounts.myInbox.id}>My Inbox ({accounts.myInbox.email})</option>}
        {accounts.talents.map(t => (
          <option key={t.inboxId} value={t.inboxId}>
            {t.talentName} ({t.email})
          </option>
        ))}
      </select>
      <button className="text-sm font-medium text-blue-600 hover:underline">Add Talent Inbox</button>
    </div>
  );
}
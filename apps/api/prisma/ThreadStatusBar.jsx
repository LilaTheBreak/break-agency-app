import React from 'react';

export default function ThreadStatusBar({ email }) {
  if (!email) return null;

  return (
    <div className="p-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
      <div>
        {email.lastOpened && (
          <span>Last opened: {new Date(email.lastOpened).toLocaleString()}</span>
        )}
      </div>
      {email.isAwaitingReply && (
        <span className="font-semibold text-yellow-600">
          Awaiting Reply
        </span>
      )}
    </div>
  );
}
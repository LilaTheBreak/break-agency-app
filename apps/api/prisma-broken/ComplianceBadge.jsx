import React from 'react';

export default function ComplianceBadge({ status }) {
  const styles = {
    passed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
  };

  if (!status) return null;

  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {status.toUpperCase()}
    </span>
  );
}
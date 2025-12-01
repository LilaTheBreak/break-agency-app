import React from 'react';

const statusStyles = {
  suggested: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  approved: 'bg-purple-100 text-purple-800',
  posted: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function AutoPostStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
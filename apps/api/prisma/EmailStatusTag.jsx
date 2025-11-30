import React from 'react';

export default function EmailStatusTag({ opened }) {
  const status = opened
    ? { text: 'Opened', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
    : { text: 'Unopened', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
      <span className={`w-2 h-2 mr-1.5 rounded-full ${status.dot}`}></span>
      {status.text}
    </span>
  );
}
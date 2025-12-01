import React from 'react';

export default function VersionTagBadge({ version }) {
  if (!version) return null;

  return (
    <span className="text-xs font-bold px-1.5 py-0.5 bg-gray-500 text-white rounded-md">v{version}</span>
  );
}
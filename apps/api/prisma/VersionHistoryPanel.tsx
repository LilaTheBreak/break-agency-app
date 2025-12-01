import React from 'react';

export default function VersionHistoryPanel({ history, onSelectVersion, currentVersion }) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Version History</h3>
      <ul className="space-y-2">
        {history.map(v => (
          <li
            key={v.id}
            onClick={() => onSelectVersion(v)}
            className={`p-2 rounded-md cursor-pointer ${currentVersion === v.version ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">Version {v.version}</span>
              <span className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <img src={v.createdBy.avatarUrl} alt={v.createdBy.name} className="w-5 h-5 rounded-full" />
              <p className="text-xs text-gray-500">by {v.createdBy.name}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">
              {v.changesAI?.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
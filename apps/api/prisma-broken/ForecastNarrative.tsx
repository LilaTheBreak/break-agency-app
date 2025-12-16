import React from 'react';

export default function ForecastNarrative({ summary }) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
      <p className="text-sm text-blue-800 dark:text-blue-300">{summary}</p>
    </div>
  );
}
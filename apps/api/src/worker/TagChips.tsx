import React from 'react';

interface TagChipsProps {
  tags: string[];
  limit?: number;
}

export default function TagChips({ tags, limit = 3 }: TagChipsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.slice(0, limit).map((tag, index) => (
        <span key={index} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">{tag}</span>
      ))}
    </div>
  );
}
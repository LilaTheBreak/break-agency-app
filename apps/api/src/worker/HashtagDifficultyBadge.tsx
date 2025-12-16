import React from 'react';

const difficultyStyles = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export default function HashtagDifficultyBadge({ difficulty }: { difficulty: string }) {
  if (!difficulty) return null;

  return (
    <span
      className={`w-2 h-2 rounded-full ${difficultyStyles[difficulty] || 'bg-gray-400'}`}
      title={`Difficulty: ${difficulty}`}
    />
  );
}
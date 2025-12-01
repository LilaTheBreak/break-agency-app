import React from 'react';
import TagChips from './TagChips';

interface TagCategoryListProps {
  title: string;
  tags: string[];
}

export default function TagCategoryList({ title, tags }: TagCategoryListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-gray-500 mb-1">{title}</h4>
      <TagChips tags={tags} limit={10} />
    </div>
  );
}
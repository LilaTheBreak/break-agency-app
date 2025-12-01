import React from 'react';

export default function CommentThread({ comment, onUpdate }) {
  const handleResolve = async () => {
    await fetch(`/api/creative-review/comment/${comment.id}/resolve`, { method: 'POST' });
    onUpdate();
  };

  return (
    <div className={`p-3 rounded-lg ${comment.resolved ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-700'}`}>
      <div className="flex items-start gap-3">
        <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-8 h-8 rounded-full" />
        <div>
          <p className="text-sm font-semibold">{comment.author.name}</p>
          <p className={`text-sm ${comment.resolved ? 'line-through' : ''}`}>{comment.message}</p>
        </div>
      </div>
      {!comment.resolved && (
        <div className="text-right mt-2">
          <button onClick={handleResolve} className="text-xs text-green-600">Resolve</button>
        </div>
      )}
      {/* Replies would be rendered here */}
    </div>
  );
}
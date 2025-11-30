import React from 'react';

const AIToolbarButton = ({ children }) => (
  <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
    {children}
  </button>
);

export default function AIReplyToolbar({ onApply }) {
  // In a real implementation, these buttons would trigger API calls
  // via the useEmailComposer hook and then call onApply(generatedText).
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold mr-2">✨ AI Assist</span>
      <AIToolbarButton>Generate Reply</AIToolbarButton>
      <AIToolbarButton>Rewrite Tone</AIToolbarButton>
      <AIToolbarButton>Shorten</AIToolbarButton>
      <AIToolbarButton>More Formal</AIToolbarButton>
      <AIToolbarButton>More Casual</AIToolbarButton>
      <div className="ml-auto flex gap-2">
        <AIToolbarButton>Undo</AIToolbarButton>
        <AIToolbarButton>Regenerate</AIToolbarButton>
      </div>
    </div>
  );
}
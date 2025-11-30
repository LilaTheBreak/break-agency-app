import React, { useState } from 'react';

export default function ReplyBox({ onSend, onExpand }) {
  const [replyText, setReplyText] = useState('');

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSend(replyText);
    setReplyText('');
  };

  return (
    <div className="p-4 border-t dark:border-gray-700">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Reply..."
        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
        rows={3}
      />
      <div className="mt-2 flex justify-between items-center">
        <button
          onClick={handleSend}
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Send
        </button>
        <button onClick={onExpand} className="text-sm text-gray-500 hover:underline">Expand</button>
      </div>
    </div>
  );
}
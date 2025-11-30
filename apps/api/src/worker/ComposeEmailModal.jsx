import React from 'react';
import { useEmailComposer } from '../../hooks/useEmailComposer';
import AIReplyToolbar from './AIReplyToolbar';
import AttachmentUploader from './AttachmentUploader';

export default function ComposeEmailModal({ initialData, onClose }) {
  const { subject, body, recipients, attachments, isSending, setField, send, saveDraft } = useEmailComposer(initialData);

  const handleRecipientsChange = (type, value) => {
    setField('recipients', { ...recipients, [type]: value.split(',') });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header className="p-4 bg-gray-100 dark:bg-gray-700 rounded-t-lg">
          <h2 className="font-semibold text-lg">New Message</h2>
        </header>
        <main className="p-4 space-y-3 overflow-y-auto">
          <input
            type="text"
            placeholder="To"
            value={recipients.to.join(',')}
            onChange={(e) => handleRecipientsChange('to', e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setField('subject', e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
          />
          <AIReplyToolbar onApply={(text) => setField('body', body + text)} />
          <textarea
            placeholder="Compose your email..."
            value={body}
            onChange={(e) => setField('body', e.target.value)}
            className="w-full p-2 border rounded-md h-64 resize-none dark:bg-gray-900 dark:border-gray-600"
          />
          <AttachmentUploader
            attachments={attachments}
            onUpload={(newAttachments) => setField('attachments', newAttachments)}
          />
        </main>
        <footer className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={send}
            disabled={isSending}
            className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
          <div>
            <button onClick={saveDraft} className="text-sm text-gray-500 hover:underline mr-4">Save Draft</button>
            <button onClick={onClose} className="text-sm text-gray-500 hover:underline">Cancel</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
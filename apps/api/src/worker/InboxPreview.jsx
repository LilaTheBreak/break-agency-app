import React, { useState } from "react";
import { useInboxContext } from "../../context/InboxContext";
import ReplyBox from "./ReplyBox";
import ThreadView from "./ThreadView";
import ComposeEmailModal from "./ComposeEmailModal";

const ActionButton = ({ children, onClick, variant }) => (
  <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-md ${variant === 'secondary' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-white dark:bg-gray-700 border dark:border-gray-600 hover:bg-gray-50'}`}>
    {children}
  </button>
);

export default function InboxPreview() {
  const { selectedEmail, loading } = useInboxContext();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState({});

  if (loading) {
    return <div className="flex-grow p-6 animate-pulse bg-white dark:bg-gray-900"></div>;
  }

  if (!selectedEmail) {
    return (
      <main className="flex-grow p-6 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Select an email to read</h2>
          <p className="mt-1 text-sm text-gray-500">Nothing selected</p>
        </div>
      </main>
    );
  }

  const handleReply = () => {
    setComposeInitialData({
      recipients: { to: [selectedEmail.from] },
      subject: `Re: ${selectedEmail.subject}`,
    });
    setIsComposeOpen(true);
  };

  return (
    <>
      <main className="flex-grow flex flex-col bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedEmail.subject}</h1>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            From: {selectedEmail.from || "N/A"} To: {selectedEmail.to || "N/A"}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          <div
            className="p-6 prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedEmail.body?.replace(/\n/g, "<br />") || "" }}
          />
          <ThreadView threadId={selectedEmail.threadId} />
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex gap-2">
          <ActionButton onClick={handleReply}>Reply</ActionButton>
          <ActionButton>Forward</ActionButton>
          <ActionButton onClick={handleReply} variant="secondary">AI Reply</ActionButton>
        </div>

        <ReplyBox onSend={(text) => console.log(text)} onExpand={handleReply} />
      </main>
      {isComposeOpen && (
        <ComposeEmailModal initialData={composeInitialData} onClose={() => setIsComposeOpen(false)} />
      )}
    </>
  );
}
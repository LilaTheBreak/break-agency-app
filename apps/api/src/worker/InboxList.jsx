import React from "react";
import { useInboxContext } from "../../context/InboxContext";

const StatusDot = ({ opened }) => (
  <span className={`w-2 h-2 rounded-full ${opened ? "bg-gray-400" : "bg-blue-500"}`}></span>
);

const CategoryBadge = ({ category }) => {
  const colors = {
    deal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    invite: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    gifting: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    spam: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[category] || colors.other}`}>
      {category}
    </span>
  );
};

const InboxItem = ({ email, onSelect, isSelected }) => (
  <li
    onClick={() => onSelect(email)}
    className={`p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 ${isSelected ? "bg-gray-100 dark:bg-gray-800" : ""}`}
  >
    <div className="flex justify-between items-start">
      <div className="font-semibold text-gray-800 dark:text-gray-200">{email.aiBrand || "Unknown Sender"}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <StatusDot opened={!isSelected} />
        {new Date(email.receivedAt).toLocaleDateString()}
      </div>
    </div>
    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{email.subject}</div>
    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{email.snippet}</div>
    <div className="mt-2 flex gap-2">
      <CategoryBadge category={email.aiCategory} />
    </div>
  </li>
);

export default function InboxList() {
  const { emails, loading, selectedEmail, selectEmail } = useInboxContext();

  if (loading) {
    return <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 animate-pulse"></div>;
  }

  return (
    <aside className="w-1/4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <ul>
        {emails.map((email) => (
          <InboxItem key={email.id} email={email} onSelect={selectEmail} isSelected={selectedEmail?.id === email.id} />
        ))}
      </ul>
    </aside>
  );
}
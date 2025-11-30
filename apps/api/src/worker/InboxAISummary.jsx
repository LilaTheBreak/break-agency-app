import React from "react";
import { useInboxContext } from "../../context/InboxContext";
import InboxRecommendedAction from "./InboxRecommendedAction";

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <div className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{children}</div>
  </div>
);

export default function InboxAISummary() {
  const { selectedEmail, loading } = useInboxContext();

  if (loading) {
    return <div className="w-1/4 p-6 border-l border-gray-200 dark:border-gray-700 animate-pulse"></div>;
  }

  if (!selectedEmail) {
    return <aside className="w-1/4 p-6 border-l border-gray-200 dark:border-gray-700"></aside>;
  }

  return (
    <aside className="w-1/4 p-6 border-l border-gray-200 dark:border-gray-700 overflow-y-auto space-y-6">
      <h2 className="text-xl font-bold">AI Summary</h2>
      <div className="space-y-4">
        <InfoCard title="Category">{selectedEmail.aiCategory || "N/A"}</InfoCard>
        <InfoCard title="Brand">{selectedEmail.aiBrand || "N/A"}</InfoCard>
        <InfoCard title="Urgency">{selectedEmail.aiUrgency || "N/A"}</InfoCard>
        <InfoCard title="Deadline">{selectedEmail.aiDeadline ? new Date(selectedEmail.aiDeadline).toLocaleDateString() : "N/A"}</InfoCard>
        <InfoCard title="Summary">{selectedEmail.aiSummary || "No summary available."}</InfoCard>
      </div>
      <hr className="my-6 border-gray-200 dark:border-gray-700" />
      <InboxRecommendedAction email={selectedEmail} />
    </aside>
  );
}
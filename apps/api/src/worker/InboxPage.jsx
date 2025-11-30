import React from "react";
import { InboxProvider } from "../../context/InboxContext";
import InboxList from "../../components/inbox/InboxList";
import InboxPreview from "../../components/inbox/InboxPreview";
import InboxAISummary from "../../components/inbox/InboxAISummary";
import InboxFilters from "../../components/inbox/InboxFilters";

export default function InboxPage() {
  return (
    <InboxProvider>
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <InboxFilters />
        <div className="flex flex-grow overflow-hidden">
          <InboxList />
          <InboxPreview />
          <InboxAISummary />
        </div>
      </div>
    </InboxProvider>
  );
}
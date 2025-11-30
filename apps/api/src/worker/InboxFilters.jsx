import React from "react";

const FilterButton = ({ children, active }) => (
  <button
    className={`px-4 py-2 text-sm font-medium rounded-md ${
      active
        ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    }`}
  >
    {children}
  </button>
);

export default function InboxFilters() {
  // In a real app, these would be wired to the useInbox hook's applyFilter function.
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      <FilterButton active>All</FilterButton>
      <FilterButton>Priority</FilterButton>
      <FilterButton>Deals</FilterButton>
      <FilterButton>Invites</FilterButton>
      <FilterButton>Gifting</FilterButton>
      <div className="ml-auto">
        {/* Talent Dropdown would go here */}
        <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm">
          <option>All Talent</option>
        </select>
      </div>
    </div>
  );
}
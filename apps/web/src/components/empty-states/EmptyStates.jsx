import React from 'react';
import { Inbox, Users, Package, AlertCircle, FileText, TrendingUp } from 'lucide-react';

/**
 * Empty state components for different sections of the platform
 * Shows helpful messages and actions when no data exists yet
 */

/**
 * Empty inbox state
 */
export function EmptyInbox({ onConnectGmail }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No emails yet
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        Connect your Gmail account to start syncing your inbox and tracking important conversations with brands and creators.
      </p>
      <button
        onClick={onConnectGmail}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Connect Gmail
      </button>
      <a
        href="/docs/gmail-inbox-guide"
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        Learn more about Gmail integration
      </a>
    </div>
  );
}

/**
 * Empty contacts/creators list
 */
export function EmptyContacts({ type = 'contacts', onAdd }) {
  const labels = {
    contacts: {
      title: 'No contacts yet',
      description: 'Start building your network by adding brand contacts or creators.',
      buttonText: 'Add Contact',
    },
    creators: {
      title: 'No creators yet',
      description: 'Import or add creators to start building your talent roster.',
      buttonText: 'Add Creator',
    },
    brands: {
      title: 'No brands yet',
      description: 'Add brand contacts to start tracking partnership opportunities.',
      buttonText: 'Add Brand',
    },
  };

  const content = labels[type] || labels.contacts;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        {content.description}
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
      >
        {content.buttonText}
      </button>
    </div>
  );
}

/**
 * Empty deals/pipeline state
 */
export function EmptyDeals({ onCreateDeal }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No deals in pipeline
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        Create your first deal to start tracking partnerships and campaigns. Deals help you manage negotiations from initial contact to signed contract.
      </p>
      <button
        onClick={onCreateDeal}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
      >
        Create Deal
      </button>
      <a
        href="/docs/outreach-deal-contract-flow"
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        Learn about the deal workflow
      </a>
    </div>
  );
}

/**
 * Empty campaigns state
 */
export function EmptyCampaigns({ onCreateCampaign }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <TrendingUp className="w-8 h-8 text-orange-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No campaigns yet
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        Launch your first campaign to start working with creators. Campaigns help you manage deliverables, track content, and measure performance.
      </p>
      <button
        onClick={onCreateCampaign}
        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
      >
        Create Campaign
      </button>
    </div>
  );
}

/**
 * Empty contracts state
 */
export function EmptyContracts({ onCreateContract }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No contracts yet
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        Contracts are created from won deals. Close a deal first, then generate a contract to formalize the partnership terms.
      </p>
      {onCreateContract ? (
        <button
          onClick={onCreateContract}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Create Contract
        </button>
      ) : (
        <a
          href="/crm/deals"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Go to Deals
        </a>
      )}
      <a
        href="/docs/outreach-deal-contract-flow"
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        Learn about contracts
      </a>
    </div>
  );
}

/**
 * Empty pending users (admin)
 */
export function EmptyPendingUsers() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No pending approvals
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-4">
        All caught up! There are no users waiting for approval.
      </p>
      <p className="text-xs text-gray-500 text-center max-w-sm">
        New user registrations will appear here for your review.
      </p>
    </div>
  );
}

/**
 * Empty outreach campaigns
 */
export function EmptyOutreach({ onCreateOutreach }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-pink-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No outreach campaigns
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        Create an outreach campaign to contact multiple creators at once. Track opens, replies, and conversions in one place.
      </p>
      <button
        onClick={onCreateOutreach}
        className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 transition-colors"
      >
        Create Outreach Campaign
      </button>
      <a
        href="/docs/outreach-deal-contract-flow"
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        Learn about outreach
      </a>
    </div>
  );
}

/**
 * Empty search results
 */
export function EmptySearch({ query, onClearSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No results found
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        {query ? (
          <>No results for "<span className="font-medium">{query}</span>". Try a different search term.</>
        ) : (
          'No results found. Try adjusting your filters or search terms.'
        )}
      </p>
      {onClearSearch && (
        <button
          onClick={onClearSearch}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear Search
        </button>
      )}
    </div>
  );
}

/**
 * Generic empty state
 */
export function EmptyState({ 
  icon: Icon = Package, 
  title, 
  description, 
  action,
  link 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.text}
        </button>
      )}
      {link && (
        <a
          href={link.href}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          {link.text}
        </a>
      )}
    </div>
  );
}

export default {
  EmptyInbox,
  EmptyContacts,
  EmptyDeals,
  EmptyCampaigns,
  EmptyContracts,
  EmptyPendingUsers,
  EmptyOutreach,
  EmptySearch,
  EmptyState,
};

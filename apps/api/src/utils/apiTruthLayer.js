/**
 * API Response Standardization — Platform Truth Layer (Backend)
 * 
 * Ensures all API responses include explicit state information about data availability,
 * limitations, and sync status. This eliminates silent failures and ambiguous empty states.
 * 
 * All endpoints should return responses using these helpers to maintain consistent
 * truth communication across the platform.
 */

/**
 * Standard API response structure
 */
export function apiResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      dataState: meta.dataState || "ready", // ready | syncing | limited | partial
      source: meta.source || "database", // database | cache | external-api | mock
      limitations: meta.limitations || null, // Array of limitation strings
      syncStatus: meta.syncStatus || null, // { lastSync, nextSync, status }
      ...meta
    }
  };
}

/**
 * Response for empty data sets with context
 */
export function emptyResponse(resource, reason = "no-data", meta = {}) {
  return {
    success: true,
    data: [],
    meta: {
      timestamp: new Date().toISOString(),
      dataState: reason, // "no-data" | "syncing" | "limited" | "not-configured"
      resource,
      message: getEmptyMessage(resource, reason),
      ...meta
    }
  };
}

/**
 * Response for endpoints not yet implemented
 */
export function notImplementedResponse(feature, requiredSteps = []) {
  return {
    success: false,
    implemented: false,
    feature,
    message: `${feature} API is not yet implemented`,
    requiredSteps,
    meta: {
      timestamp: new Date().toISOString(),
      dataState: "not-implemented"
    }
  };
}

/**
 * Response for features behind gates/flags
 */
export function featureDisabledResponse(featureName, unlockCriteria = []) {
  return {
    success: false,
    enabled: false,
    feature: featureName,
    message: `${featureName} is currently disabled`,
    unlockCriteria,
    meta: {
      timestamp: new Date().toISOString(),
      dataState: "feature-disabled"
    }
  };
}

/**
 * Response for data that's still syncing
 */
export function syncingResponse(resource, syncInfo = {}) {
  return {
    success: true,
    data: syncInfo.partialData || [],
    meta: {
      timestamp: new Date().toISOString(),
      dataState: "syncing",
      resource,
      message: `${resource} are being synced in the background`,
      syncStatus: {
        inProgress: true,
        lastSync: syncInfo.lastSync || null,
        nextSync: syncInfo.nextSync || null,
        estimatedCompletion: syncInfo.estimatedCompletion || null,
        status: syncInfo.status || "in-progress"
      }
    }
  };
}

/**
 * Response for limited/partial data (e.g., public data only)
 */
export function limitedResponse(data, limitations = []) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      dataState: "limited",
      limitations,
      message: `Data is limited: ${limitations.join(", ")}`
    }
  };
}

/**
 * Error response with explicit failure state
 */
export function errorResponse(message, details = {}) {
  return {
    success: false,
    error: message,
    details,
    meta: {
      timestamp: new Date().toISOString(),
      dataState: "error"
    }
  };
}

/**
 * Helper to generate contextual empty messages
 */
function getEmptyMessage(resource, reason) {
  const messages = {
    "no-data": {
      campaigns: "No campaigns created yet. Create your first campaign to get started.",
      deals: "No deals yet. Start by creating your first deal.",
      opportunities: "No opportunities available. Check back later for new opportunities.",
      invoices: "No invoices yet. Invoices will appear here once deals are finalized.",
      messages: "No messages yet. Your inbox will show messages from your connections.",
      tasks: "No tasks yet. Create tasks to organize your work.",
      analytics: "No analytics data yet. Data will appear once you have activity.",
      posts: "No posts yet. Posts will appear once your social accounts are connected."
    },
    "syncing": {
      campaigns: "Campaigns are being synced. Check back in a few moments.",
      deals: "Deals are being synced from your CRM.",
      opportunities: "Opportunities are being refreshed.",
      invoices: "Invoice data is being updated.",
      messages: "Syncing your latest messages.",
      tasks: "Syncing task updates.",
      analytics: "Refreshing analytics data.",
      posts: "Fetching latest posts from connected accounts."
    },
    "limited": {
      campaigns: "Viewing limited campaign data. Connect additional accounts for full access.",
      deals: "Showing public deal information only.",
      opportunities: "Showing publicly available opportunities only.",
      invoices: "Payment integration required for full invoice data.",
      messages: "Connect your email to see all messages.",
      tasks: "Some tasks may be hidden based on permissions.",
      analytics: "Analytics limited to publicly available data.",
      posts: "Showing public posts only. Connect accounts for full analytics."
    },
    "not-configured": {
      campaigns: "Campaign tracking not configured. Contact support to enable.",
      deals: "Deal pipeline not set up. Configure your deal stages first.",
      opportunities: "Opportunity board not enabled. Enable this feature in settings.",
      invoices: "Payment provider not connected. Set up Stripe integration first.",
      messages: "Email sync not configured. Connect your email account.",
      tasks: "Task management not enabled for your account.",
      analytics: "Analytics integration not configured.",
      posts: "Social accounts not connected. Connect Instagram, TikTok, or YouTube."
    }
  };

  return messages[reason]?.[resource] || `No ${resource} available (${reason})`;
}

/**
 * Middleware to wrap responses with truth layer
 */
export function withTruthLayer(handler) {
  return async (req, res, next) => {
    try {
      // Inject response helpers into req object
      req.apiResponse = (data, meta) => res.json(apiResponse(data, meta));
      req.emptyResponse = (resource, reason, meta) => res.json(emptyResponse(resource, reason, meta));
      req.notImplementedResponse = (feature, steps) => res.status(501).json(notImplementedResponse(feature, steps));
      req.featureDisabledResponse = (feature, criteria) => res.status(403).json(featureDisabledResponse(feature, criteria));
      req.syncingResponse = (resource, syncInfo) => res.json(syncingResponse(resource, syncInfo));
      req.limitedResponse = (data, limitations) => res.json(limitedResponse(data, limitations));
      req.errorResponse = (message, details) => res.status(500).json(errorResponse(message, details));

      await handler(req, res, next);
    } catch (error) {
      console.error("Error in truth layer handler:", error);
      res.status(500).json(errorResponse(error.message, { stack: error.stack }));
    }
  };
}

/**
 * Helper to check if data should show "syncing" state
 */
export function isSyncing(lastSyncTime, syncIntervalMinutes = 15) {
  if (!lastSyncTime) return false;
  const minutesSinceSync = (Date.now() - new Date(lastSyncTime).getTime()) / 1000 / 60;
  return minutesSinceSync < syncIntervalMinutes;
}

/**
 * Helper to add sync metadata to responses
 */
export function withSyncMeta(data, syncRecord) {
  return {
    ...data,
    _sync: {
      lastSync: syncRecord?.lastSync || null,
      nextSync: syncRecord?.nextSync || null,
      status: syncRecord?.status || "idle",
      isStale: syncRecord ? isSyncing(syncRecord.lastSync) === false : true
    }
  };
}

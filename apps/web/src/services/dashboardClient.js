import { apiFetch } from "./apiClient.js";

/**
 * Fetches the aggregate stats for the main dashboard.
 */
export async function getDashboardStats() {
  const response = await apiFetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  return response.json();
}

/**
 * Fetches a list of recent activity logs.
 * @param {number} limit - The number of items to fetch.
 */
export async function getRecentActivity(limit = 5) {
  try {
    const response = await apiFetch(`/api/activity?limit=${limit}`);
    
    // Handle permission errors gracefully - return empty array
    if (response.status === 403) {
      console.warn("[Activity] Permission denied (403)");
      return [];
    }
    
    // Handle not found - return empty array
    if (response.status === 404) {
      console.warn("[Activity] Endpoint not found (404)");
      return [];
    }
    
    // Handle server errors gracefully - return empty array instead of crashing
    if (response.status >= 500) {
      console.error("[Activity] Server error (" + response.status + ")");
      return [];
    }
    
    // If response is ok, return data (even if empty array)
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    
    // For any other error, return empty array (graceful degradation)
    console.warn("[Activity] Failed to fetch (status " + response.status + ")");
    return [];
  } catch (error) {
    console.error("[Activity] Fetch error:", error);
    return [];
  }
}

/**
 * Fetches a list of pending approvals.
 * @param {number} limit - The number of items to fetch.
 */
export async function getPendingApprovals(limit = 4) {
  try {
    const response = await apiFetch(`/api/approvals?status=pending&limit=${limit}`);
    
    // Handle permission errors gracefully
    if (response.status === 403) {
      console.warn("[Approvals] Permission denied (403)");
      return [];
    }
    
    // Handle not found
    if (response.status === 404) {
      console.warn("[Approvals] Endpoint not found (404)");
      return [];
    }
    
    // Handle server errors gracefully
    if (response.status >= 500) {
      console.error("[Approvals] Server error (" + response.status + ")");
      return [];
    }
    
    // If response is ok, return data
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    
    // For any other error
    console.warn("[Approvals] Failed to fetch (status " + response.status + ")");
    return [];
  } catch (error) {
    console.error("[Approvals] Fetch error:", error);
    return [];
  }
}

/**
 * Fetches data for the campaign pacing chart.
 */
export async function getCampaignPacing() {
  const response = await apiFetch("/api/dashboard/campaign-pacing");
  if (!response.ok) throw new Error("Failed to fetch campaign pacing");
  return response.json();
}

/**
 * Fetches data for the revenue breakdown chart.
 */
export async function getRevenueBreakdown() {
  const response = await apiFetch("/api/dashboard/revenue-breakdown");
  if (!response.ok) throw new Error("Failed to fetch revenue breakdown");
  return response.json();
}

/**
 * Fetches a list of recent users.
 * @param {number} limit - The number of users to fetch.
 */
export async function getRecentUsers(limit = 5) {
  const response = await apiFetch(`/api/users?sort=createdAt:desc&limit=${limit}`);
  
  // Handle permission errors
  if (response.status === 403) {
    throw new Error("403: You don't have permission to view users");
  }
  
  // Handle not found
  if (response.status === 404) {
    throw new Error("404: Users endpoint not available");
  }
  
  if (!response.ok) {
    throw new Error("Failed to fetch recent users");
  }
  
  const data = await response.json();
  // Always return an array
  return Array.isArray(data) ? data : [];
}
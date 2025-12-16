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
  const response = await apiFetch(`/api/activity?limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch recent activity");
  return response.json();
}

/**
 * Fetches a list of pending approvals.
 * @param {number} limit - The number of items to fetch.
 */
export async function getPendingApprovals(limit = 4) {
  const response = await apiFetch(`/api/approvals?status=pending&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch pending approvals");
  return response.json();
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
  if (!response.ok) throw new Error("Failed to fetch recent users");
  return response.json();
}
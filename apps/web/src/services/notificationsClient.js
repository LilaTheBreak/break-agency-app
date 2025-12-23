import { apiFetch } from "./apiClient.js";

/**
 * Fetch all notifications for the current user
 * @param {boolean} unreadOnly - If true, only fetch unread notifications
 * @returns {Promise<Array>}
 */
export async function fetchNotifications(unreadOnly = false) {
  try {
    const queryParam = unreadOnly ? "?unreadOnly=true" : "";
    const response = await apiFetch(`/api/notifications${queryParam}`);
    return response;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

/**
 * Fetch unread notification count for the current user
 * @returns {Promise<{count: number}>}
 */
export async function fetchUnreadCount() {
  try {
    const response = await apiFetch("/api/notifications/unread-count");
    return response;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw new Error("Failed to fetch unread count");
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const response = await apiFetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH"
    });
    return response;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}

/**
 * Mark all notifications as read
 * @returns {Promise<{count: number}>}
 */
export async function markAllNotificationsAsRead() {
  try {
    const response = await apiFetch("/api/notifications/mark-all-read", {
      method: "PATCH"
    });
    return response;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }
}

/**
 * Delete a notification
 * @param {string} notificationId
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteNotification(notificationId) {
  try {
    const response = await apiFetch(`/api/notifications/${notificationId}`, {
      method: "DELETE"
    });
    return response;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }
}

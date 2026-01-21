import { apiFetch } from "./apiClient.js";

/**
 * Link a user to a talent
 */
export async function linkUserToTalent(userId, talentId) {
  return apiFetch(`/api/admin/users/${userId}/link-talent/${talentId}`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

/**
 * Add an email to a talent
 */
export async function addEmailToTalent(talentId, email, label, isPrimary = false) {
  return apiFetch(`/api/admin/talents/${talentId}/add-email`, {
    method: "POST",
    body: JSON.stringify({ email, label, isPrimary })
  });
}

/**
 * Get all emails for a talent
 */
export async function getTalentEmails(talentId) {
  return apiFetch(`/api/admin/talents/${talentId}/emails`, {
    method: "GET"
  });
}

/**
 * Search talents by name or email
 */
export async function searchTalents(query) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  
  return apiFetch(`/api/admin/talents/search?${params.toString()}`, {
    method: "GET"
  });
}

/**
 * Get all talents
 */
export async function getAllTalents() {
  return apiFetch(`/api/admin/talents`, {
    method: "GET"
  });
}

import { apiFetch } from "./apiClient.js";

/**
 * Submit onboarding responses to backend for admin approval
 * @param {Object} responses - The complete onboarding form responses
 * @param {string} role - The user's selected role (CREATOR, UGC, etc.)
 * @param {string} context - The user's context (Creator, UGC creator, etc.)
 * @returns {Promise<Response>}
 */
export async function submitOnboarding(responses, role, context) {
  return apiFetch("/api/auth/onboarding/submit", {
    method: "POST",
    body: JSON.stringify({
      responses,
      role,
      context,
    }),
  });
}

/**
 * Get the current user's onboarding status
 * @returns {Promise<Response>}
 */
export async function getOnboardingStatus() {
  return apiFetch("/api/auth/me", {
    method: "GET",
  });
}

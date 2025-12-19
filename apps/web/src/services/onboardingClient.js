const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

/**
 * Submit onboarding responses to backend for admin approval
 * @param {Object} responses - The complete onboarding form responses
 * @param {string} role - The user's selected role (CREATOR, UGC_TALENT, etc.)
 * @param {string} context - The user's context (Creator, UGC creator, etc.)
 * @returns {Promise<Response>}
 */
export async function submitOnboarding(responses, role, context) {
  const response = await fetch(`${API_URL}/api/auth/onboarding/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      responses,
      role,
      context,
    }),
  });

  return response;
}

/**
 * Get the current user's onboarding status
 * @returns {Promise<Response>}
 */
export async function getOnboardingStatus() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  return response;
}

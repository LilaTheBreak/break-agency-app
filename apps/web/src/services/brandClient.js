/**
 * Brand client - Frontend API calls for brand management
 */

import { apiFetch } from "./apiClient.js";

/**
 * Create a brand quickly (inline creation for deals/contacts)
 * 
 * @param {string} name - Brand name
 * @returns {Promise<{id: string, name: string}>}
 */
export async function createBrand(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Brand name is required");
  }

  const response = await apiFetch("/api/brands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });

  if (!response.ok) {
    // Try to parse error response as JSON, fallback to status text
    let errorMessage = `Failed to create brand (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (parseError) {
      // Response wasn't valid JSON, use status text
      console.warn("[brandClient] Error response was not valid JSON:", parseError);
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Parse success response as JSON, with better error handling
  try {
    const data = await response.json();
    if (!data || !data.id) {
      throw new Error("Invalid response: missing brand ID");
    }
    return data;
  } catch (parseError) {
    console.error("[brandClient] Failed to parse JSON response:", parseError);
    throw new Error("Failed to parse brand response from server");
  }
}

/**
 * Fetch all brands
 * 
 * @param {number} limit - Max brands to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<{brands: Array, total: number}>}
 */
export async function fetchBrands(limit = 100, offset = 0) {
  const params = new URLSearchParams({ limit, offset });
  const response = await apiFetch(`/api/brands?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch brands");
  }

  return response.json();
}

/**
 * Get a single brand by ID
 */
export async function fetchBrand(brandId) {
  const response = await apiFetch(`/api/brands/${brandId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch brand");
  }

  return response.json();
}

/**
 * Update a brand
 */
export async function updateBrand(brandId, updates) {
  const response = await apiFetch(`/api/brands/${brandId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update brand");
  }

  return response.json();
}

export default {
  createBrand,
  fetchBrands,
  fetchBrand,
  updateBrand,
};

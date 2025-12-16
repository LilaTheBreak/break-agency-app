import { apiFetch } from "./apiClient.js";

/**
 * Submits a new wellness check-in.
 * @param {object} data - { mood, stress, energy, journal }
 */
export const submitCheckIn = async (data) => {
  const response = await apiFetch("/api/wellness/check-in", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to submit check-in");
  return response.json();
};

export const getWellnessHistory = async (days = 30) => {
  const response = await apiFetch(`/api/wellness/history?days=${days}`);
  if (!response.ok) throw new Error("Failed to fetch wellness history");
  return response.json();
};

export const getWellnessInsights = async () => {
  const response = await apiFetch(`/api/wellness/insights`);
  if (!response.ok) throw new Error("Failed to fetch wellness insights");
  return response.json();
};
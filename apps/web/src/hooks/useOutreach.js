import { apiFetch } from "../services/apiClient.js";

export function useOutreach() {
  const triggerOutreach = async (dryRun = true) => {
    const res = await apiFetch("/outreach/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Outreach failed");
    return data;
  };

  const createProspects = async (niche, count) => {
    const res = await apiFetch("/outreach/prospect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, count })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Prospect generation failed");
    return data;
  };

  const startSequence = async (leadId) => {
    const res = await apiFetch(`/outreach/start/${leadId}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to start sequence");
    return data;
  };

  const pauseSequence = async (seqId) => {
    const res = await apiFetch(`/outreach/sequence/${seqId}/pause`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to pause sequence");
    return data;
  };

  return { triggerOutreach, createProspects, startSequence, pauseSequence };
}

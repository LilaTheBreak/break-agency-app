import { apiFetch } from "../services/apiClient.js";

export function useContracts() {
  async function submitContract({ fileId, brandName }) {
    const res = await apiFetch("/contracts/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, brandName })
    });
    return res.json();
  }

  async function getContract(id) {
    const res = await apiFetch(`/contracts/${encodeURIComponent(id)}`);
    return res.json();
  }

  return { submitContract, getContract };
}

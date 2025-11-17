import { apiFetch } from "./apiClient.js";

function authHeaders(session) {
  if (!session?.email) return {};
  const headers = { "x-user-id": session.email };
  if (session.roles?.length) headers["x-user-roles"] = session.roles.join(",");
  return headers;
}

export async function listContracts(session) {
  const response = await apiFetch("/contracts", {
    headers: {
      ...authHeaders(session)
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to fetch contracts");
  }
  return response.json();
}

export async function createContractRequest(session, payload) {
  const response = await apiFetch("/contracts/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(session)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to create contract");
  }
  return response.json();
}

export async function sendContractRequest(session, payload) {
  const response = await apiFetch("/contracts/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(session)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to send contract");
  }
  return response.json();
}

export async function fetchContractStatus(session, contractId) {
  const response = await apiFetch(`/contracts/${encodeURIComponent(contractId)}/status`, {
    headers: {
      ...authHeaders(session)
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to check status");
  }
  return response.json();
}

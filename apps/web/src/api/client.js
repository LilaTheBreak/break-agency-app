const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request(path, options = {}) {
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || data.title || res.statusText;
    } catch {
      detail = res.statusText;
    }
    const error = new Error(detail);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;

  return res.json();
}

export function getListings(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return request(`/api/listings${qs ? `?${qs}` : ""}`);
}

export function getListing(id) {
  return request(`/api/listings/${id}`);
}

export function getListingViewings(id) {
  return request(`/api/listings/${id}/viewings`);
}

export function createListing(payload) {
  return request("/api/listings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateListing(id, payload) {
  return request(`/api/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getContacts(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.q) query.set("q", params.q);
  const qs = query.toString();
  return request(`/api/contacts${qs ? `?${qs}` : ""}`);
}

export function getViewings(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });
  const qs = query.toString();
  return request(`/api/viewings${qs ? `?${qs}` : ""}`);
}

export function getInterestLeads() {
  return request("/api/interest");
}

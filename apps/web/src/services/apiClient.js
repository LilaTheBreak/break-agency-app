const RAW_API_BASE = import.meta.env?.VITE_API_URL;
const API_BASE = RAW_API_BASE && RAW_API_BASE.length ? RAW_API_BASE : "/api";

const NORMALIZED_BASE = API_BASE.replace(/\/$/, "");

export function apiUrl(path = "") {
  if (!path) return NORMALIZED_BASE;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${NORMALIZED_BASE}${normalizedPath}`;
}

export async function apiFetch(path, options = {}) {
  const target = /^https?:/i.test(path) ? path : apiUrl(path);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  // Add Bearer token from localStorage for cross-domain auth
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(target, {
    ...options,
    headers,
    credentials: "include"
  });
  return response;
}

export { NORMALIZED_BASE as API_BASE };

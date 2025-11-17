const RAW_API_BASE = import.meta.env?.VITE_API_URL ?? "/api";
const API_BASE = typeof RAW_API_BASE === "string" && RAW_API_BASE.length ? RAW_API_BASE : "/api";
const NORMALIZED_BASE = API_BASE.replace(/\/$/, "");

export function apiUrl(path = "") {
  if (!path) return NORMALIZED_BASE;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${NORMALIZED_BASE}${normalizedPath}`;
}

export function apiFetch(path, options) {
  const target = /^https?:/i.test(path) ? path : apiUrl(path);
  return fetch(target, options);
}

export { NORMALIZED_BASE as API_BASE };

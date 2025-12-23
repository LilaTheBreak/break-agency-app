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

  try {
    const response = await fetch(target, {
      ...options,
      headers,
      credentials: "include"
    });

    // Add helper method for safe JSON parsing
    const originalJson = response.json.bind(response);
    response.json = async function() {
      const text = await this.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        // If response is HTML (auth redirect, error page), return safe error object
        if (text.trim().startsWith('<!')) {
          console.warn(`[API] Received HTML instead of JSON from ${path}. Possible auth redirect.`);
          return { error: "Authentication required", _isHtmlResponse: true };
        }
        console.error(`[API] Invalid JSON from ${path}:`, text.substring(0, 100));
        throw new Error(`Invalid JSON response from ${path}`);
      }
    };

    return response;
  } catch (error) {
    console.error(`[API] Fetch error for ${path}:`, error);
    throw error;
  }
}

export { NORMALIZED_BASE as API_BASE };

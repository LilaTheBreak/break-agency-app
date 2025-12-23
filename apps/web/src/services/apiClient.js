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
          // Only warn on real auth issues (401), not permission issues
          if (this.status === 401) {
            console.warn(`[API] Authentication required for ${path}`);
          }
          return { error: "Authentication required", _isHtmlResponse: true };
        }
        // Only log parsing errors for 500s, not expected failures
        if (this.status >= 500) {
          console.error(`[API] Invalid JSON from ${path}:`, text.substring(0, 100));
        }
        throw new Error(`Invalid JSON response from ${path}`);
      }
    };

    // Log only real errors (500+), not permission/not-found
    if (response.status >= 500) {
      console.error(`[API] Server error ${response.status} for ${path}`);
    } else if (response.status === 403 || response.status === 404) {
      // Silent - these are often expected (permissions, feature flags)
    }

    return response;
  } catch (error) {
    // Only log unexpected network errors
    if (error.name !== 'AbortError') {
      console.error(`[API] Network error for ${path}:`, error);
    }
    throw error;
  }
}

export { NORMALIZED_BASE as API_BASE };

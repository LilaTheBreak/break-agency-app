import toast from 'react-hot-toast';

// Clean and validate the API URL
const RAW_API_BASE = import.meta.env?.VITE_API_URL;
let API_BASE = "/api"; // Default fallback

if (RAW_API_BASE && RAW_API_BASE.length) {
  // Remove any trailing newlines, whitespace, or escaped characters
  const cleaned = RAW_API_BASE.replace(/\\n|\\r|\n|\r/g, '').trim();
  
  // If it's a full URL (starts with http), append /api
  if (/^https?:\/\//i.test(cleaned)) {
    API_BASE = cleaned.replace(/\/$/, '') + '/api';
  } else {
    API_BASE = cleaned || "/api";
  }
}

const NORMALIZED_BASE = API_BASE.replace(/\/$/, "");

console.log("[apiClient] Using API base URL:", NORMALIZED_BASE);

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
            toast.error('Authentication required. Please sign in again.');
          }
          return { error: "Authentication required", _isHtmlResponse: true };
        }
        // Only log parsing errors for 500s, not expected failures
        if (this.status >= 500) {
          console.error(`[API] Invalid JSON from ${path}:`, text.substring(0, 100));
          toast.error('Server error: Invalid response format');
        }
        throw new Error(`Invalid JSON response from ${path}`);
      }
    };

    // Show toast notifications for errors
    if (response.status >= 500) {
      console.error(`[API] Server error ${response.status} for ${path}`);
      toast.error(`Server error (${response.status}): Failed to ${extractAction(path)}`);
    } else if (response.status === 403) {
      toast.error(`Permission denied: You don't have access to ${extractAction(path)}`);
    } else if (response.status === 404) {
      // Silent for 404s - often expected (checking if resource exists)
    } else if (response.status === 401) {
      toast.error('Session expired. Please sign in again.');
    }

    return response;
  } catch (error) {
    // Show toast for network errors
    if (error.name !== 'AbortError') {
      console.error(`[API] Network error for ${path}:`, error);
      toast.error(`Connection failed: Unable to ${extractAction(path)}`);
    }
    throw error;
  }
}

// Helper to extract action from API path for clearer error messages
function extractAction(path) {
  const parts = path.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1];
  
  // Common patterns
  if (path.includes('/gmail')) return 'connect Gmail';
  if (path.includes('/approve')) return 'approve user';
  if (path.includes('/reject')) return 'reject user';
  if (path.includes('/upload')) return 'upload file';
  if (path.includes('/delete')) return 'delete item';
  if (path.includes('/update')) return 'update item';
  if (path.includes('/create')) return 'create item';
  if (path.includes('/sync')) return 'sync data';
  
  // Fallback to resource name
  return lastPart || 'complete action';
}

export { NORMALIZED_BASE as API_BASE };

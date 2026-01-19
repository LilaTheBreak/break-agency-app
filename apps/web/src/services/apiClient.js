import toast from 'react-hot-toast';

// CRITICAL: Enforce VITE_API_URL in all environments
const RAW_API_BASE = import.meta.env?.VITE_API_URL;

if (!RAW_API_BASE || !RAW_API_BASE.trim()) {
  throw new Error(
    'VITE_API_URL environment variable is required. App cannot start. ' +
    'Set VITE_API_URL in your .env file (e.g., VITE_API_URL=https://api.example.com/api)'
  );
}

// Clean and validate the API URL
const cleaned = RAW_API_BASE.replace(/\\n|\\r|\n|\r/g, '').trim();

let API_BASE = "/api"; // Should never use this

if (/^https?:\/\//i.test(cleaned)) {
  // Remove trailing slash
  let base = cleaned.replace(/\/$/, '');
  // Only append /api if it doesn't already end with /api
  if (!base.endsWith('/api')) {
    base = base + '/api';
  }
  API_BASE = base;
} else {
  // Non-HTTP URLs are not allowed in production
  throw new Error(
    `VITE_API_URL must be a full HTTP(S) URL, not a relative path. Got: "${cleaned}"`
  );
}

const NORMALIZED_BASE = API_BASE.replace(/\/$/, "");

console.log("[apiClient] Using API base URL:", NORMALIZED_BASE);

export function apiUrl(path = "") {
  if (!path) return NORMALIZED_BASE;
  
  // Remove leading /api from path if it exists (since NORMALIZED_BASE already includes /api)
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // If the base URL already includes /api and the path starts with /api, remove the duplicate
  if (NORMALIZED_BASE.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.substring(4); // Remove '/api' prefix
  }
  
  // Ensure path starts with /
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
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
    // Note: Don't show errors for /auth/me - it's expected to return 200 or 401 when not logged in
    const isAuthMe = path.includes('/auth/me');
    
    if (response.status >= 500) {
      console.error(`[API] Server error ${response.status} for ${path}`);
      if (!isAuthMe) {
        toast.error(`Server error (${response.status}): Failed to ${extractAction(path)}`);
      }
    } else if (response.status === 403) {
      // For /auth/me, 403 might be a CORS issue - don't show confusing error
      if (isAuthMe) {
        console.warn(`[API] CORS or permission issue for /auth/me - this is expected if not logged in`);
      } else {
        toast.error(`Permission denied: You don't have access to ${extractAction(path)}`);
      }
    } else if (response.status === 404) {
      // Silent for 404s - often expected (checking if resource exists)
    } else if (response.status === 401) {
      // For /auth/me, 401 is expected when not logged in - don't show error
      if (!isAuthMe) {
        toast.error('Session expired. Please sign in again.');
      }
    }

    return response;
  } catch (error) {
    // Show toast for network errors
    if (error.name !== 'AbortError') {
      console.error(`[API] Network error for ${path}:`, error);
      const action = extractAction(path);
      const errorDetail = error.message ? ` - ${error.message}` : '';
      toast.error(`Connection failed: Unable to ${action}${errorDetail}`);
    }
    throw error;
  }
}

// Helper to extract action from API path for clearer error messages
function extractAction(path) {
  const parts = path.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1];
  
  // Auth-specific patterns
  if (path.includes('/auth/me')) return 'fetch user profile';
  if (path.includes('/auth/welcome')) return 'send welcome email';
  if (path.includes('/auth/login')) return 'sign in';
  if (path.includes('/auth/signup')) return 'sign up';
  if (path.includes('/auth/logout')) return 'sign out';
  if (path.includes('/auth/verify')) return 'verify email';
  
  // Common patterns
  if (path.includes('/gmail')) return 'connect Gmail';
  if (path.includes('/approve')) return 'approve user';
  if (path.includes('/reject')) return 'reject user';
  if (path.includes('/upload')) return 'upload file';
  if (path.includes('/delete')) return 'delete item';
  if (path.includes('/update')) return 'update item';
  if (path.includes('/create')) return 'create item';
  if (path.includes('/sync')) return 'sync data';
  if (path.includes('/socials')) return 'manage social profiles';
  if (path.includes('/talent')) return 'manage talent';
  if (path.includes('/campaigns')) return 'load campaigns';
  
  // Fallback to resource name
  return lastPart || 'complete action';
}

export { NORMALIZED_BASE as API_BASE };

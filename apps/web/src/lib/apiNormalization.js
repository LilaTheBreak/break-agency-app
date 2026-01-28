/**
 * API NORMALIZATION UTILITIES
 * 
 * PRINCIPLE: APIs are untrusted input. Normalize once. Trust everywhere else.
 * 
 * This module provides:
 * - Safe API response parsing (handles HTML, malformed JSON, etc.)
 * - Consistent error shapes
 * - Collection normalization (ensure arrays are always arrays)
 * - Runtime assertions for debugging
 * 
 * Usage:
 * 
 * ```javascript
 * import { apiFetchSafe, normalizeArray, normalizeApiResponse } from '@/lib/apiNormalization';
 * 
 * // In hooks/services:
 * const data = await apiFetchSafe('/api/brands');
 * const brands = normalizeArray(data.brands);
 * 
 * // For existing apiFetch calls that need normalization:
 * const response = await apiFetch('/api/deals');
 * const { data, error } = await normalizeApiResponse(response);
 * ```
 */

/**
 * Normalize any value to an array
 * Handles common API response patterns:
 * - Direct array: [1, 2, 3]
 * - Wrapped array: { data: [1, 2, 3] }
 * - Nested wrapper: { data: { items: [1, 2, 3] } }
 * - null/undefined: []
 * - Single item: { item } → [item]
 */
export function normalizeArray(value, options = {}) {
  const { 
    warnOnInvalid = true, 
    context = 'unknown',
    allowSingleItem = false 
  } = options;

  // Already an array
  if (Array.isArray(value)) {
    return value;
  }

  // Null or undefined
  if (value === null || value === undefined) {
    return [];
  }

  // Check common wrapper patterns
  if (typeof value === 'object') {
    // Pattern: { data: [...] }
    if (Array.isArray(value.data)) {
      return value.data;
    }

    // Pattern: { items: [...] }
    if (Array.isArray(value.items)) {
      return value.items;
    }

    // Pattern: { results: [...] }
    if (Array.isArray(value.results)) {
      return value.results;
    }

    // Pattern: { data: { items: [...] } }
    if (value.data && Array.isArray(value.data.items)) {
      return value.data.items;
    }

    // Single item that should be wrapped in array
    if (allowSingleItem) {
      return [value];
    }
  }

  // Diagnostic logging for invalid shapes
  if (warnOnInvalid) {
    console.warn(
      `[API Normalization] Expected array but received ${typeof value} for context: ${context}`,
      { value, valueType: typeof value, valueConstructor: value?.constructor?.name }
    );
  }

  return [];
}

/**
 * Normalize API error response into consistent shape
 */
export function normalizeError(error, context = '') {
  if (!error) {
    return {
      message: 'Unknown error occurred',
      status: 500,
      context
    };
  }

  // Already normalized
  if (error.message && typeof error.message === 'string') {
    return {
      message: error.message,
      status: error.status || error.statusCode || 500,
      details: error.details,
      context
    };
  }

  // Backend error shapes
  if (error.error) {
    return {
      message: typeof error.error === 'string' ? error.error : error.error.message || 'API error',
      status: error.status || error.statusCode || 500,
      details: error.details,
      context
    };
  }

  // Validation errors
  if (Array.isArray(error.errors)) {
    return {
      message: error.errors.map(e => e.message || e.msg).filter(Boolean).join(', ') || 'Validation failed',
      status: 400,
      details: error.errors,
      context
    };
  }

  // Network/fetch errors
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 0,
      details: { name: error.name, stack: error.stack },
      context
    };
  }

  // Fallback for unknown shapes
  return {
    message: String(error),
    status: 500,
    context
  };
}

/**
 * Safely parse JSON with fallback
 * Handles HTML responses, plain text, malformed JSON
 */
export async function safeJsonParse(response, context = '') {
  try {
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      return { success: true, data: null };
    }

    // Check if response is HTML (common for 500 errors, auth redirects)
    if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
      console.warn(`[API] Received HTML instead of JSON for ${context}`, {
        status: response.status,
        statusText: response.statusText,
        preview: text.substring(0, 100)
      });

      return {
        success: false,
        error: {
          message: response.status === 401 
            ? 'Authentication required' 
            : response.status >= 500 
            ? 'Server error' 
            : 'Invalid response format',
          status: response.status,
          _isHtmlResponse: true
        }
      };
    }

    // Attempt JSON parse
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (parseError) {
      console.error(`[API] JSON parse failed for ${context}:`, {
        status: response.status,
        text: text.substring(0, 200),
        error: parseError.message
      });

      return {
        success: false,
        error: {
          message: 'Invalid JSON response',
          status: response.status,
          details: { parseError: parseError.message, preview: text.substring(0, 100) }
        }
      };
    }
  } catch (error) {
    console.error(`[API] Failed to read response for ${context}:`, error);
    return {
      success: false,
      error: {
        message: 'Failed to read response',
        status: response.status,
        details: { error: error.message }
      }
    };
  }
}

/**
 * Normalize any API response into { data, error } shape
 * Use this to wrap existing apiFetch calls
 */
export async function normalizeApiResponse(response, context = '') {
  if (!response) {
    return {
      data: null,
      error: { message: 'No response received', status: 0, context }
    };
  }

  // Handle Response objects
  if (response instanceof Response) {
    // Error response
    if (!response.ok) {
      const { success, data, error } = await safeJsonParse(response, context);
      
      if (success && data) {
        return {
          data: null,
          error: normalizeError(data, context)
        };
      }

      return {
        data: null,
        error: error || {
          message: response.statusText || 'Request failed',
          status: response.status,
          context
        }
      };
    }

    // Success response
    const { success, data, error } = await safeJsonParse(response, context);
    
    if (!success) {
      return {
        data: null,
        error: error || { message: 'Failed to parse response', status: response.status, context }
      };
    }

    return {
      data,
      error: null
    };
  }

  // Already parsed data
  return {
    data: response,
    error: null
  };
}

/**
 * Safe wrapper for apiFetch that returns normalized { data, error } shape
 * 
 * This is the RECOMMENDED way to make API calls going forward.
 * 
 * @param {string} path - API endpoint path
 * @param {Object} options - fetch options
 * @returns {Promise<{data: any, error: {message: string, status: number} | null}>}
 * 
 * @example
 * const { data, error } = await apiFetchSafe('/api/brands');
 * if (error) {
 *   console.error('Failed to fetch brands:', error.message);
 *   return;
 * }
 * const brands = normalizeArray(data);
 */
export async function apiFetchSafe(path, options = {}) {
  try {
    // Import apiFetch dynamically to avoid circular dependencies
    const { apiFetch } = await import('../services/apiClient.js');
    
    const response = await apiFetch(path, options);
    return await normalizeApiResponse(response, path);
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, path)
    };
  }
}

/**
 * Assert that a value is an array at runtime
 * Useful for debugging API contract violations
 */
export function assertArray(value, context = '') {
  if (!Array.isArray(value)) {
    const error = new Error(
      `[API Contract Violation] Expected array but received ${typeof value} for: ${context}`
    );
    
    console.error(error.message, {
      value,
      valueType: typeof value,
      context,
      stack: error.stack
    });

    // In development, throw to catch bugs early
    if (import.meta.env.DEV) {
      throw error;
    }

    return false;
  }

  return true;
}

/**
 * Safe .filter() that handles non-arrays gracefully
 */
export function safeFilter(value, predicate, context = '') {
  const arr = normalizeArray(value, { context });
  return arr.filter(predicate);
}

/**
 * Safe .map() that handles non-arrays gracefully
 */
export function safeMap(value, mapper, context = '') {
  const arr = normalizeArray(value, { context });
  return arr.map(mapper);
}

/**
 * Safe .find() that handles non-arrays gracefully
 */
export function safeFind(value, predicate, context = '') {
  const arr = normalizeArray(value, { context });
  return arr.find(predicate);
}

/**
 * Safe .reduce() that handles non-arrays gracefully
 */
export function safeReduce(value, reducer, initialValue, context = '') {
  const arr = normalizeArray(value, { context });
  return arr.reduce(reducer, initialValue);
}

/**
 * Deduplicate array by ID field
 */
export function deduplicateById(array, idField = 'id') {
  const seen = new Set();
  return array.filter(item => {
    if (!item || !item[idField]) return false;
    if (seen.has(item[idField])) return false;
    seen.add(item[idField]);
    return true;
  });
}

/**
 * Create a safe API hook wrapper
 * Returns loading state, data (normalized), error
 * 
 * @example
 * const { data: brands, loading, error } = useApiQuery('/api/brands', normalizeArray);
 */
export function createSafeHook(hookName) {
  return function useSafeQuery(fetcher, normalizer = (x) => x) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          setError(null);

          const result = await fetcher();
          
          if (cancelled) return;

          const normalized = normalizer(result);
          setData(normalized);
        } catch (err) {
          if (cancelled) return;
          
          console.error(`[${hookName}] Query failed:`, err);
          setError(normalizeError(err, hookName));
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [fetcher, normalizer]);

    return { data, loading, error };
  };
}

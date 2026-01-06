/**
 * ASSET HELPER - Centralized asset URL construction
 * 
 * **Purpose:**
 * Enforce that ALL image/asset URLs load from the frontend origin,
 * never from the API domain.
 * 
 * **Rule:**
 * ✅ DO:  asset('/logo.png') → https://www.tbctbctbc.online/logo.png
 * ❌ DON'T: Use VITE_API_URL for image src attributes
 * 
 * **Implementation:**
 * Images MUST use root-relative paths (/path/to/image)
 * This ensures they load from the frontend origin, not the API
 */

/**
 * Construct an asset URL from a root-relative path
 * @param {string} path - Root-relative path (e.g., "/logo.png", "/logos/amex.png")
 * @returns {string} - Full URL to the asset
 * 
 * @example
 * asset('/logo.png')  // Returns: /logo.png in dev, full origin URL in app
 * asset('/images/default-avatar.png')
 */
export function asset(path) {
  if (!path) {
    throw new Error('[assetHelper] Asset path is required. Got:', path);
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Dev check: Throw if path looks like an API URL
  if (typeof window !== 'undefined') {
    // ❌ REGRESSION CHECK: Throw if someone accidentally uses API domain
    if (
      normalizedPath.includes('breakagencyapi') ||
      normalizedPath.includes('railway.app') ||
      normalizedPath.includes('http://') ||
      normalizedPath.includes('https://')
    ) {
      throw new Error(
        `[assetHelper] REGRESSION DETECTED: Asset path contains API domain!\n` +
        `Path: ${normalizedPath}\n` +
        `Assets must ALWAYS load from the frontend origin.\n` +
        `Use absolute paths like '/logo.png', not API URLs.`
      );
    }
  }

  // Return root-relative path
  // Vercel/browser will resolve this to the frontend origin
  return normalizedPath;
}

/**
 * ADD GLOBAL ASSERTION: Warn on suspicious <img> src attributes
 * 
 * In development, intercept img elements and throw if src contains API domain
 */
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  // Hook into img element creation
  const originalCreateElement = document.createElement;
  
  // Override createElement to check img elements
  Document.prototype.createElement = function(tag) {
    const element = originalCreateElement.call(this, tag);
    
    if (tag === 'img') {
      // Intercept src attribute setter
      const originalSetAttribute = element.setAttribute.bind(element);
      
      element.setAttribute = function(name, value) {
        if (name === 'src' && value) {
          // Check for API domain in src
          if (
            value.includes('breakagencyapi') ||
            value.includes('railway.app') ||
            (value.startsWith('http') && !value.startsWith('https://via.placeholder') && !value.startsWith('https://ui-avatars') && !value.startsWith('https://images.unsplash'))
          ) {
            console.error(
              `[assetHelper] ❌ REGRESSION: Image src contains API/external domain!\n` +
              `Element: <img src="${value}" />\n` +
              `This will fail in production. Use relative paths like '/logo.png' instead.`,
              element
            );
            
            // In strict mode, throw
            if (window.__ASSET_HELPER_STRICT === true) {
              throw new Error(
                `[assetHelper] Image src contains API domain: ${value}`
              );
            }
          }
        }
        return originalSetAttribute(name, value);
      };
    }
    
    return element;
  };
}

/**
 * MIGRATION GUIDE: Converting existing code
 * 
 * ❌ Before (hardcoded absolute paths):
 *    <img src="/logo.png" />
 * 
 * ✅ After (using helper, same result):
 *    <img src={asset('/logo.png')} />
 * 
 * Or just keep the hardcoded paths - they already work!
 * This helper is here to centralize and protect them.
 */

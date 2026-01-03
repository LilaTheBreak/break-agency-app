import { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * Hook to fetch public CMS page content (no authentication required)
 * 
 * @param {string} slug - CMS page slug (must be in public allowlist)
 * @returns {{ blocks: Array, loading: boolean, error: Error | null }}
 */
export function usePublicCmsPage(slug) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCmsPage() {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(`/api/content/public/${slug}`, {
          method: "GET",
          // No auth headers needed - this is a public endpoint
        });

        if (cancelled) return;

        if (!response.ok) {
          if (response.status === 404) {
            // Page not found or not in allowlist - this is OK, use fallback
            setBlocks([]);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch CMS page: ${response.status}`);
        }

        const data = await response.json();
        
        if (cancelled) return;

        // Ensure blocks is always an array
        setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      } catch (err) {
        if (cancelled) return;
        console.warn(`[CMS] Failed to load CMS page '${slug}':`, err);
        setError(err);
        setBlocks([]); // Fallback to empty - will use hardcoded content
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCmsPage();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { blocks, loading, error };
}


import { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * Hook to check if an email has a detected opportunity
 * @param {string} emailId - InboundEmail ID
 * @returns {Object} { hasOpportunity, opportunity, loading }
 */
export function useEmailOpportunity(emailId) {
  const [hasOpportunity, setHasOpportunity] = useState(false);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!emailId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function checkOpportunity() {
      try {
        // Check if this email has an associated opportunity
        const response = await apiFetch(`/api/opportunities/by-email/${emailId}`);
        
        if (!cancelled && response) {
          setHasOpportunity(true);
          setOpportunity(response);
        }
      } catch (error) {
        // If 404, no opportunity exists (which is expected for most emails)
        if (error.status !== 404) {
          console.warn("Failed to check email opportunity:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkOpportunity();

    return () => {
      cancelled = true;
    };
  }, [emailId]);

  return { hasOpportunity, opportunity, loading };
}

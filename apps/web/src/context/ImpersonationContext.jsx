import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { apiFetch } from "../services/apiClient.js";

const ImpersonationContext = createContext(null);

export function ImpersonationProvider({ children }) {
  const [impersonationContext, setImpersonationContext] = useState(null);
  const [impersonating, setImpersonating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Start impersonating a talent user
   * Admin must have SUPERADMIN role
   */
  const startImpersonation = useCallback(async (talentUserId) => {
    try {
      setIsLoading(true);
      
      const response = await apiFetch("/api/admin/impersonate/start", {
        method: "POST",
        body: JSON.stringify({ talentUserId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to start impersonation");
      }

      const data = await response.json();
      
      // Store impersonation context in sessionStorage (cleared on browser close)
      sessionStorage.setItem(
        "impersonationContext",
        JSON.stringify(data.impersonationContext)
      );
      
      setImpersonationContext(data.impersonationContext);
      setImpersonating(true);

      return data.impersonationContext;
    } catch (error) {
      console.error("[IMPERSONATE] Error starting impersonation:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Stop impersonating and return to admin mode
   */
  const stopImpersonation = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await apiFetch("/api/admin/impersonate/stop", {
        method: "POST",
        body: JSON.stringify({
          originalAdminId: impersonationContext?.originalAdminId,
          actingAsUserId: impersonationContext?.actingAsUserId,
          durationSeconds: impersonationContext?.startedAt
            ? Math.floor(
                (Date.now() - new Date(impersonationContext.startedAt).getTime()) / 1000
              )
            : 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to stop impersonation");
      }

      // Clear impersonation from storage and state
      sessionStorage.removeItem("impersonationContext");
      setImpersonationContext(null);
      setImpersonating(false);
    } catch (error) {
      console.error("[IMPERSONATE] Error stopping impersonation:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [impersonationContext]);

  /**
   * Restore impersonation context from sessionStorage on mount
   * Useful when page is refreshed while impersonating
   */
  const restoreImpersonationContext = useCallback(() => {
    try {
      const stored = sessionStorage.getItem("impersonationContext");
      if (stored) {
        const context = JSON.parse(stored);
        setImpersonationContext(context);
        setImpersonating(true);
      }
    } catch (error) {
      console.error("[IMPERSONATE] Error restoring context:", error);
      sessionStorage.removeItem("impersonationContext");
    }
  }, []);

  const value = useMemo(
    () => ({
      impersonationContext,
      impersonating,
      isLoading,
      startImpersonation,
      stopImpersonation,
      restoreImpersonationContext,
    }),
    [impersonationContext, impersonating, isLoading, startImpersonation, stopImpersonation, restoreImpersonationContext]
  );

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}

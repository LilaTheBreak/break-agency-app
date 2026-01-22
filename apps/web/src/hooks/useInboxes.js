import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";
import toast from "react-hot-toast";

export function useInboxes() {
  const [inboxes, setInboxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [defaultInbox, setDefaultInbox] = useState(null);

  const fetchInboxes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/messaging/inboxes", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inboxes");
      }

      const data = await response.json();
      setInboxes(data.inboxes || []);

      // Set default inbox
      const defaultInb = data.inboxes?.find((i) => i.isDefault);
      setDefaultInbox(defaultInb || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[USEBOXES] Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDefaultInbox = useCallback(async () => {
    try {
      const response = await apiFetch("/api/messaging/inboxes/default", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch default inbox");
      }

      const data = await response.json();
      setDefaultInbox(data.inbox);
      return data.inbox;
    } catch (err) {
      console.error("[USEBOXES] Error fetching default inbox:", err);
      return null;
    }
  }, []);

  const createInbox = useCallback(async (provider, emailAddress) => {
    try {
      const response = await apiFetch("/api/messaging/inboxes", {
        method: "POST",
        body: JSON.stringify({
          provider,
          emailAddress,
          ownerType: "admin",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create inbox");
      }

      const data = await response.json();

      // For Gmail, redirect to auth URL
      if (provider === "gmail" && data.authUrl) {
        return {
          success: true,
          authUrl: data.authUrl,
          message: "Redirecting to Gmail authorization...",
        };
      }

      toast.success("Inbox added successfully!");
      await fetchInboxes();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
      throw err;
    }
  }, [fetchInboxes]);

  const setDefaultInbox_ = useCallback(
    async (inboxId) => {
      try {
        const response = await apiFetch(`/api/messaging/inboxes/${inboxId}`, {
          method: "PATCH",
          body: JSON.stringify({ isDefault: true }),
        });

        if (!response.ok) {
          throw new Error("Failed to set default inbox");
        }

        toast.success("Default inbox updated");
        await fetchInboxes();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(message);
        throw err;
      }
    },
    [fetchInboxes]
  );

  const deleteInbox = useCallback(
    async (inboxId) => {
      try {
        const response = await apiFetch(`/api/messaging/inboxes/${inboxId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete inbox");
        }

        toast.success("Inbox removed");
        await fetchInboxes();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(message);
        throw err;
      }
    },
    [fetchInboxes]
  );

  const updateInboxStatus = useCallback(
    async (inboxId, syncStatus) => {
      try {
        const response = await apiFetch(`/api/messaging/inboxes/${inboxId}`, {
          method: "PATCH",
          body: JSON.stringify({ syncStatus }),
        });

        if (!response.ok) {
          throw new Error("Failed to update inbox status");
        }

        await fetchInboxes();
      } catch (err) {
        console.error("[USEBOXES] Error updating inbox status:", err);
      }
    },
    [fetchInboxes]
  );

  // Fetch inboxes on mount
  useEffect(() => {
    fetchInboxes();
  }, []);

  return {
    inboxes,
    defaultInbox,
    loading,
    error,
    fetchInboxes,
    getDefaultInbox,
    createInbox,
    setDefaultInbox: setDefaultInbox_,
    deleteInbox,
    updateInboxStatus,
  };
}

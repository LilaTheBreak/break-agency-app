import { useState, useEffect, useCallback } from "react";
import * as inboxApi from "../services/inboxApi";

/**
 * A custom hook to manage the state and logic for the inbox feature.
 */
export function useInbox() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filters, setFilters] = useState({ status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInbox = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const inboxEmails = await inboxApi.getInbox(filters);
      // Sort by priority score descending
      inboxEmails.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
      setEmails(inboxEmails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const selectEmail = useCallback((email) => {
    // In a real app, you might fetch full details here
    setSelectedEmail(email);
  }, []);

  const applyFilter = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    emails,
    selectedEmail,
    filters,
    loading,
    error,
    loadInbox,
    selectEmail,
    applyFilter,
  };
}
import { useState, useEffect, useCallback } from "react";
import { normalizeArray, normalizeApiResponse } from '../lib/apiNormalization.js';

// Global cache to persist contacts across component mounts
let contactsCacheGlobal = [];
let contactsCachePromise = null;

/**
 * Normalize contacts array and deduplicate by ID
 * Handles API inconsistencies and duplicate entries
 */
function normalizeContacts(data) {
  // Use normalizeArray helper for consistent handling
  const array = normalizeArray(data, { 
    context: 'useContacts', 
    warnOnInvalid: true 
  });

  // Deduplicate by ID
  const seen = new Set();
  return array.filter((contact) => {
    if (!contact || !contact.id) return false;
    if (seen.has(contact.id)) return false;
    seen.add(contact.id);
    return true;
  });
}

/**
 * Search contacts by first name, last name, or email
 * Case-insensitive, partial match with starts-with prioritization
 */
export function searchContacts(contacts, searchText) {
  if (!searchText || !searchText.trim()) return contacts;

  const q = searchText.toLowerCase().trim();
  const parts = q.split(/\s+/);

  return contacts
    .map((contact) => {
      const firstName = (contact.firstName || "").toLowerCase();
      const lastName = (contact.lastName || "").toLowerCase();
      const email = (contact.email || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`.toLowerCase();

      // Priority 1: Exact first name or email starts-with
      let priority = 999;
      if (firstName.startsWith(q) || email.startsWith(q)) priority = 0;
      // Priority 2: Last name or full name starts-with
      else if (lastName.startsWith(q) || fullName.startsWith(q)) priority = 1;
      // Priority 3: Contains all search parts
      else if (
        parts.every(
          (part) =>
            firstName.includes(part) ||
            lastName.includes(part) ||
            email.includes(part)
        )
      )
        priority = 2;
      // Priority 4: Contains any part
      else if (
        parts.some(
          (part) =>
            firstName.includes(part) ||
            lastName.includes(part) ||
            email.includes(part)
        )
      )
        priority = 3;

      return { contact, priority };
    })
    .filter(({ priority }) => priority < 999)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Secondary sort by last name, then first name
      const aName = `${a.contact.lastName || ""} ${a.contact.firstName || ""}`.toLowerCase();
      const bName = `${b.contact.lastName || ""} ${b.contact.firstName || ""}`.toLowerCase();
      return aName.localeCompare(bName);
    })
    .map(({ contact }) => contact);
}

/**
 * Check if a contact matches (by email or full name, case-insensitive)
 */
function contactMatches(contact, email, firstName, lastName) {
  const contactEmail = (contact.email || "").toLowerCase().trim();
  const contactFirstName = (contact.firstName || "").toLowerCase().trim();
  const contactLastName = (contact.lastName || "").toLowerCase().trim();

  const searchEmail = (email || "").toLowerCase().trim();
  const searchFirstName = (firstName || "").toLowerCase().trim();
  const searchLastName = (lastName || "").toLowerCase().trim();

  // Match by email
  if (searchEmail && contactEmail === searchEmail) return true;

  // Match by full name
  if (
    searchFirstName &&
    searchLastName &&
    contactFirstName === searchFirstName &&
    contactLastName === searchLastName
  )
    return true;

  return false;
}

/**
 * useContacts hook - canonical source for contact data
 * Provides caching, deduplication, search, and create functionality
 */
export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If cache is being fetched, wait for that promise
    if (contactsCachePromise) {
      contactsCachePromise.then(() => {
        // CRITICAL: Ensure we only set arrays
        const safeContacts = Array.isArray(contactsCacheGlobal) ? contactsCacheGlobal : [];
        setContacts(safeContacts);
        setIsLoading(false);
      }).catch((err) => {
        console.error("[useContacts] Cache promise rejected:", err);
        setContacts([]);
        setError(err.message || 'Failed to fetch contacts');
        setIsLoading(false);
      });
      return;
    }

    // If cache already populated, use it
    if (contactsCacheGlobal.length > 0) {
      // CRITICAL: Ensure we only set arrays
      const safeContacts = Array.isArray(contactsCacheGlobal) ? contactsCacheGlobal : [];
      setContacts(safeContacts);
      setIsLoading(false);
      return;
    }

    // Fetch from API and populate cache
    contactsCachePromise = fetch("/api/crm-contacts")
      .then(async (res) => {
        const { data, error } = await normalizeApiResponse(res, '/api/crm-contacts');
        
        if (error) {
          throw new Error(error.message || 'Failed to fetch contacts');
        }

        const normalized = normalizeContacts(data);
        // CRITICAL: Ensure normalized is an array
        const safeNormalized = Array.isArray(normalized) ? normalized : [];
        contactsCacheGlobal = safeNormalized;
        setContacts(safeNormalized);
        setError(null);
      })
      .catch((err) => {
        console.error("[useContacts] Failed to fetch contacts:", err);
        setError(err.message);
        contactsCacheGlobal = [];
        setContacts([]);
      })
      .finally(() => {
        contactsCachePromise = null;
        setIsLoading(false);
      });
  }, []);

  /**
   * Create a new contact
   * Returns the created contact or throws an error
   */
  const createContact = useCallback(
    async (firstName, lastName, email, brandId) => {
      const trimmedEmail = (email || "").trim();
      const trimmedFirstName = (firstName || "").trim();
      const trimmedLastName = (lastName || "").trim();

      // Validate required fields
      if (!trimmedFirstName && !trimmedLastName) {
        throw new Error("First name or last name is required");
      }
      if (!trimmedEmail && !trimmedFirstName && !trimmedLastName) {
        throw new Error("Email or full name is required");
      }

      // Check for existing contact (case-insensitive)
      const existing = contacts.find((c) =>
        contactMatches(c, trimmedEmail, trimmedFirstName, trimmedLastName)
      );
      if (existing) {
        return existing; // Return existing contact instead of creating duplicate
      }

      // Create contact via API
      const response = await fetch("/api/crm-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
        }),
      });

      const { data, error } = await normalizeApiResponse(response, '/api/crm-contacts POST');

      if (error) {
        throw new Error(error.message || 'Failed to create contact');
      }

      const newContact = data?.contact || data;

      if (!newContact || !newContact.id) {
        throw new Error("Invalid response from server");
      }

      // Update cache
      // CRITICAL: Ensure contacts is an array before spreading
      const currentContacts = Array.isArray(contacts) ? contacts : [];
      const updated = normalizeContacts([...currentContacts, newContact]);
      const safeUpdated = Array.isArray(updated) ? updated : [];
      contactsCacheGlobal = safeUpdated;
      setContacts(safeUpdated);

      return newContact;
    },
    [contacts]
  );

  /**
   * Manually refetch contacts from API
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/crm-contacts");
      const { data, error } = await normalizeApiResponse(response, '/api/crm-contacts');
      
      if (error) {
        throw new Error(error.message);
      }

      const normalized = normalizeContacts(data);
      // CRITICAL: Ensure normalized is an array before setting state
      const safeNormalized = Array.isArray(normalized) ? normalized : [];
      contactsCacheGlobal = safeNormalized;
      setContacts(safeNormalized);
      setError(null);
    } catch (err) {
      console.error("[useContacts] Failed to refetch:", err);
      setError(err.message);
      // CRITICAL: Always set empty array on error, never undefined/null
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    contacts,
    isLoading,
    error,
    createContact,
    refetch,
  };
}

/**
 * Clear the global contacts cache
 * Useful for testing or explicit cache invalidation
 */
export function clearContactsCache() {
  contactsCacheGlobal = [];
  contactsCachePromise = null;
}

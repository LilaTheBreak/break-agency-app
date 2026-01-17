import React, { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";

/**
 * ContactSelect - Searchable contact selector with optional inline creation
 * 
 * Features:
 * - Search/filter contacts by first name, last name, or email
 * - Show loading state while fetching
 * - Prevent duplicate contacts (case-insensitive by email or full name)
 * - Type to create new contact (if enabled)
 * - Works like modern CRM dropdowns (Notion, Linear, HubSpot)
 * 
 * Props:
 * - contacts: Array of contact objects {id, firstName, lastName, email}
 * - value: Selected contactId
 * - onChange: (contactId) => void - Called when contact selected/created
 * - isLoading: bool - Show loading state
 * - disabled: bool - Disable interaction
 * - onCreateContact?: (firstName, lastName, email, brandId) => Promise<{id, ...}> - Create contact function
 * - brandId?: string - Brand context for creating contacts
 * - error?: string - Show error message
 * - showCreate?: bool - Allow creating contacts (default: true)
 */
export function ContactSelect({
  contacts = [],
  value,
  onChange,
  isLoading = false,
  disabled = false,
  onCreateContact,
  brandId,
  error,
  showCreate = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Get selected contact display name
  const selectedContact = useMemo(() => {
    return (contacts || []).find(c => c?.id === value);
  }, [contacts, value]);

  const selectedDisplayName = useMemo(() => {
    if (!selectedContact) return "";
    const { firstName = "", lastName = "", email = "" } = selectedContact;
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return email;
  }, [selectedContact]);

  // Advanced search: starts-with + contains matching (case-insensitive)
  // Searches firstName, lastName, and email fields
  const filteredContacts = useMemo(() => {
    if (!searchText.trim()) return contacts || [];
    
    const search = searchText.toLowerCase().trim();
    const contactArray = (contacts || []).filter(c => c); // Filter out nulls
    
    // Helper to get searchable text from contact object
    const getSearchText = (contact) => {
      const firstName = contact?.firstName || '';
      const lastName = contact?.lastName || '';
      const email = contact?.email || '';
      return `${firstName} ${lastName} ${email}`.toLowerCase();
    };
    
    // Split results: starts-with matches first, then contains matches
    const startsWithMatches = contactArray.filter(c => {
      const text = getSearchText(c);
      return text.split(/\s+/).some(part => part.startsWith(search));
    });
    
    const containsMatches = contactArray.filter(c => {
      const text = getSearchText(c);
      const startsWithAny = text.split(/\s+/).some(part => part.startsWith(search));
      return text.includes(search) && !startsWithAny;
    });
    
    return [...startsWithMatches, ...containsMatches];
  }, [contacts, searchText]);

  // Check if search text matches any existing contact (case-insensitive)
  const exactMatch = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    if (!search) return false;
    
    return (contacts || []).some(c => {
      const firstName = (c?.firstName || '').toLowerCase();
      const lastName = (c?.lastName || '').toLowerCase();
      const email = (c?.email || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
      
      return (
        firstName === search ||
        lastName === search ||
        email === search ||
        fullName === search
      );
    });
  }, [contacts, searchText]);

  // Should show "Create new contact" option?
  // Only show if user typed something AND no exact match exists AND we have contacts loaded
  const shouldShowCreate = 
    showCreate && 
    searchText.trim().length > 0 && 
    !exactMatch && 
    !isLoading && 
    onCreateContact;

  const handleCreateContact = useCallback(async () => {
    if (!onCreateContact) {
      console.warn("onCreateContact handler not provided");
      return;
    }

    const input = searchText.trim();
    if (!input) {
      setCreateError("Please enter a name or email");
      return;
    }

    // Try to parse as email or name
    let firstName = "";
    let lastName = "";
    let email = "";

    if (input.includes("@")) {
      email = input;
      // Try to extract name from email prefix
      const [namePart] = input.split("@");
      const parts = namePart.split(/[._-]/);
      if (parts.length > 0) {
        firstName = parts[0];
        if (parts.length > 1) {
          lastName = parts.slice(1).join(" ");
        }
      }
    } else {
      // Treat as name
      const parts = input.split(/\s+/);
      if (parts.length > 0) {
        firstName = parts[0];
        if (parts.length > 1) {
          lastName = parts.slice(1).join(" ");
        }
      }
    }

    if (!firstName && !lastName && !email) {
      setCreateError("Please enter a name or email");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const newContact = await onCreateContact(
        firstName,
        lastName,
        email,
        brandId
      );
      
      if (!newContact || !newContact.id) {
        throw new Error("API returned invalid contact response");
      }

      // Auto-select the newly created contact
      onChange(newContact.id);
      setIsOpen(false);
      setSearchText("");
    } catch (err) {
      console.error("[ContactSelect] Create error:", err);
      setCreateError(err.message || "Failed to create contact. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }, [onCreateContact, searchText, brandId]);

  const handleSelectContact = useCallback((contactId) => {
    onChange(contactId);
    setIsOpen(false);
    setSearchText("");
  }, [onChange]);

  // Handle keyboard navigation and Esc key
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="relative w-full">
      {/* Main dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        className="w-full rounded-lg border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-left focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 disabled:opacity-50 flex items-center justify-between hover:border-brand-black/20 transition"
      >
        <span className={isLoading ? "text-brand-black/50" : "text-brand-black"}>
          {isLoading 
            ? "Loading contacts..." 
            : selectedDisplayName || "Select a contact"}
        </span>
        <svg 
          className={`h-4 w-4 text-brand-black/60 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 14l-7 7m0 0l-7-7m7 7V3" 
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full z-[100] mt-2 w-full rounded-lg border border-brand-black/10 bg-brand-white shadow-xl">
          {/* Search input */}
          <div className="border-b border-brand-black/5 p-2">
            <input
              autoFocus
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search contacts or create..."
              className="w-full rounded px-3 py-2 text-sm border border-brand-black/10 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          {/* Contact list or empty state */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-brand-black/50">
                Loading contacts...
              </div>
            ) : filteredContacts.length > 0 ? (
              <>
                {filteredContacts.map((contact) => {
                  const displayName = contact.firstName || contact.lastName 
                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                    : contact.email;
                  
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectContact(contact.id)}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-brand-linen/60 transition border-b border-brand-black/5 last:border-b-0"
                    >
                      <div className="font-medium text-brand-black">
                        {displayName}
                      </div>
                      {contact.email && (
                        <div className="text-xs text-brand-black/60">
                          {contact.email}
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="px-4 py-3 text-sm text-brand-black/50">
                No matching contacts found
              </div>
            )}

            {/* Create new contact action */}
            {shouldShowCreate && (
              <>
                <div className="border-t border-brand-black/5" />
                <button
                  type="button"
                  onClick={handleCreateContact}
                  disabled={isCreating}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-brand-red/5 transition flex items-center gap-2 text-brand-red disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {isCreating 
                    ? "Creating..." 
                    : `Create "${searchText.trim()}"`}
                </button>
              </>
            )}

            {/* Error message */}
            {createError && (
              <div className="border-t border-brand-black/5 px-4 py-2">
                <p className="text-xs text-brand-red">
                  {createError}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message below */}
      {error && (
        <div className="mt-1 text-xs text-brand-red">
          {error}
        </div>
      )}
    </div>
  );
}

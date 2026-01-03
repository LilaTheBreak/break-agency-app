import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { BrandChip } from "../components/BrandChip.jsx";
import { ContactChip } from "../components/ContactChip.jsx";
import { OutreachRecordsPanel } from "../components/OutreachRecordsPanel.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { formatCampaignDateRange } from "../lib/crmCampaigns.js";
import { EventChip } from "../components/EventChip.jsx";
import { formatEventDateTimeRange } from "../lib/crmEvents.js";
import { DealChip } from "../components/DealChip.jsx";
import { ContractChip } from "../components/ContractChip.jsx";
import { computeExpiryRisk, formatContractEndDate } from "../lib/crmContracts.js";
import { fetchCampaigns, fetchEvents, fetchDeals, fetchContracts } from "../services/crmClient.js";
import { NotesIntelligenceSection } from "../components/NotesIntelligenceSection.jsx";
import {
  fetchBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  fetchContacts,
  createContact,
  updateContact,
  deleteContact,
  addContactNote as addContactNoteAPI,
} from "../services/crmClient.js";
import { checkForLocalStorageData, migrateLocalStorageToDatabase } from "../lib/crmMigration.js";
import { normalizeApiArray, normalizeApiArrayWithGuard } from "../lib/dataNormalization.js";
import Button, { PrimaryButton, SecondaryButton, DangerButton, TextButton } from "../components/Button.jsx";

const BRAND_STATUSES = ["Prospect", "Active", "Past"];
const BRAND_INDUSTRIES = [
  "Fashion",
  "Beauty",
  "Hospitality",
  "Travel",
  "Tech",
  "Finance",
  "Luxury",
  "Culture",
  "Food & Beverage",
  "Other"
];

const LIFECYCLE_STAGES = [
  { value: "", label: "Not set" },
  { value: "Lead", label: "Lead" },
  { value: "Prospect", label: "Prospect" },
  { value: "Active", label: "Active" },
  { value: "Dormant", label: "Dormant" },
  { value: "Inactive", label: "Inactive" }
];

const RELATIONSHIP_STRENGTHS = [
  { value: "", label: "Not set" },
  { value: "New", label: "New" },
  { value: "Weak", label: "Weak" },
  { value: "Moderate", label: "Moderate" },
  { value: "Strong", label: "Strong" }
];

function nowIso() {
  return new Date().toISOString();
}

function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toExternalUrl(value) {
  const url = (value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function shortActivity(entry) {
  if (!entry) return "—";
  return entry;
}

function Pill({ tone = "neutral", children }) {
  const toneClass =
    tone === "positive"
      ? "border-brand-black/10 bg-brand-white text-brand-black"
      : "border-brand-black/10 bg-brand-white text-brand-black/70";
  return (
    <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${toneClass}`}>
      {children}
    </span>
  );
}

// Removed local TextButton and PrimaryButton - using imported components from Button.jsx

function BrandAvatar({ name, logo, logoUrl, size = "md" }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg"
  };

  const getInitials = (brandName) => {
    if (!brandName) return "?";
    const words = brandName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Use logoUrl (enriched) if available, fallback to logo (manual)
  const imageUrl = logoUrl || logo;

  if (imageUrl) {
    return (
      <div className={`flex-shrink-0 overflow-hidden rounded-full border border-brand-black/10 bg-brand-white ${sizeClasses[size]}`}>
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div
          className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-linen to-brand-white font-semibold text-brand-black/70"
          style={{ display: 'none' }}
        >
          {getInitials(name)}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-full border border-brand-black/10 bg-gradient-to-br from-brand-linen to-brand-white ${sizeClasses[size]}`}>
      <div className="flex h-full w-full items-center justify-center font-semibold text-brand-black/70">
        {getInitials(name)}
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ open, onClose, onConfirm, brandName, hasLinkedObjects, linkedObjectsSummary }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (confirmText !== brandName) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const canDelete = confirmText === brandName && !hasLinkedObjects;

  const modalContent = (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-black/10 bg-brand-white p-8 shadow-[0_35px_120px_rgba(0,0,0,0.3)]">
        <div className="mb-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Delete Brand</p>
          <h3 className="mt-2 font-display text-2xl uppercase text-brand-black">Confirm Deletion</h3>
        </div>

        {hasLinkedObjects ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
              <p className="text-sm font-semibold text-brand-red">Cannot delete brand with linked objects</p>
              <p className="mt-2 text-xs text-brand-black/70">
                This brand has linked CRM objects that must be removed first:
              </p>
              <ul className="mt-3 space-y-1 text-xs text-brand-black/70">
                {linkedObjectsSummary.campaigns > 0 && (
                  <li>• {linkedObjectsSummary.campaigns} campaign{linkedObjectsSummary.campaigns !== 1 ? 's' : ''}</li>
                )}
                {linkedObjectsSummary.deals > 0 && (
                  <li>• {linkedObjectsSummary.deals} deal{linkedObjectsSummary.deals !== 1 ? 's' : ''}</li>
                )}
                {linkedObjectsSummary.events > 0 && (
                  <li>• {linkedObjectsSummary.events} event{linkedObjectsSummary.events !== 1 ? 's' : ''}</li>
                )}
                {linkedObjectsSummary.contracts > 0 && (
                  <li>• {linkedObjectsSummary.contracts} contract{linkedObjectsSummary.contracts !== 1 ? 's' : ''}</li>
                )}
                {linkedObjectsSummary.outreach > 0 && (
                  <li>• {linkedObjectsSummary.outreach} outreach record{linkedObjectsSummary.outreach !== 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <TextButton onClick={onClose}>Close</TextButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
              <p className="text-sm font-semibold text-brand-red">This action cannot be undone</p>
              <p className="mt-2 text-xs text-brand-black/70">
                Deleting <span className="font-semibold">{brandName}</span> will permanently remove all brand data, contacts, and notes.
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
                Type the brand name to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={brandName}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <TextButton onClick={onClose} disabled={loading}>Cancel</TextButton>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canDelete || loading}
                className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete Brand"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      >
        {options.map((o) => {
          const isObject = typeof o === 'object' && o !== null;
          const optionValue = isObject ? o.value : o;
          const optionLabel = isObject ? o.label : o;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      />
    </label>
  );
}

function Drawer({ open, title, onClose, children, actions }) {
  const drawerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Trap focus inside drawer
  useEffect(() => {
    if (!open) return;

    const drawerElement = drawerRef.current;
    if (!drawerElement) return;

    const focusableElements = drawerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    drawerElement.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      drawerElement.removeEventListener("keydown", handleTab);
    };
  }, [open]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`absolute right-0 top-0 flex h-full flex-col border-l border-brand-black/10 bg-brand-white shadow-[0_35px_120px_rgba(0,0,0,0.25)] transition-all duration-300 ${
          isFullscreen ? "w-full" : "w-full max-w-[480px]"
        }`}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b border-brand-black/5 bg-brand-white px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Brands</p>
              <h3 id="drawer-title" className="font-display text-2xl uppercase text-brand-black">{title}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-full border border-brand-black/20 px-3 py-1.5 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5 transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              {actions}
              <TextButton onClick={onClose}>Close</TextButton>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">{children}</div>
        </div>
      </aside>
    </div>
  );

  // Render drawer via portal to document.body
  return createPortal(drawerContent, document.body);
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-12 text-center">
      <div className="mx-auto max-w-md">
        <p className="font-display text-2xl uppercase text-brand-black">Start building your brand network</p>
        <p className="mt-3 text-sm leading-relaxed text-brand-black/70">
          Add your first brand to track partnerships, deals, and campaigns. Brands are long-lived CRM entities that persist even without login.
        </p>
        <div className="mt-8 flex justify-center">
          <PrimaryButton onClick={onAdd}>Add your first brand</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ActionsMenu({ onEdit, onOpen, onDelete, isSuperadmin }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Brand actions"
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-brand-black/10 bg-brand-white p-2 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpen();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            Edit brand
          </button>
          {isSuperadmin && onDelete && (
            <>
              <div className="my-2 border-t border-brand-black/5" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-brand-red hover:bg-brand-red/5"
              >
                Delete brand
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ContactActionsMenu({ onView, onEdit, onAddNote }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Contact actions"
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-brand-black/10 bg-brand-white p-2 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            View contact
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            Edit contact
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddNote();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            Add note
          </button>
          <div className="my-2 border-t border-brand-black/10" />
          <button
            type="button"
            className="block w-full cursor-not-allowed rounded-xl px-3 py-2 text-left text-brand-black/40"
            title="Coming soon"
          >
            Create task (coming soon)
          </button>
          <button
            type="button"
            className="block w-full cursor-not-allowed rounded-xl px-3 py-2 text-left text-brand-black/40"
            title="Coming soon"
          >
            Create outreach (coming soon)
          </button>
        </div>
      ) : null}
    </div>
  );
}

function deriveHint(brand) {
  // Design-only AI & future hooks: labels, not dashboards.
  const hints = [];
  if (brand.status === "Active" && brand.linkedDealsCount >= 3) hints.push("Repeat partner");
  if (brand.status === "Prospect" && brand.linkedDealsCount === 0) hints.push("New relationship");
  if (brand.status === "Past") hints.push("Dormant");
  return hints.slice(0, 2);
}

export function AdminBrandsPage({ session }) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isSuperadmin = hasRole("SUPERADMIN");
  const ownerDefault =
    session?.name?.split(" ")?.[0] || session?.email?.split("@")?.[0]?.split(".")?.[0] || "Admin";

  const [brands, setBrands] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentSuggestion, setEnrichmentSuggestion] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contracts, setContracts] = useState([]);
  
  // Wrapper functions to ensure state is always an array (must be after useState declarations)
  // Use normalizeApiArray to handle all edge cases (empty strings, null, undefined, wrapped objects)
  const safeSetBrands = (value) => {
    const safe = normalizeApiArray(value, 'brands');
    setBrands(safe);
  };
  const safeSetContacts = (value) => {
    const safe = normalizeApiArray(value, 'contacts');
    setContacts(safe);
  };
  const safeSetCampaigns = (value) => {
    const safe = normalizeApiArray(value, 'campaigns');
    setCampaigns(safe);
  };
  const safeSetEvents = (value) => {
    const safe = normalizeApiArray(value, 'events');
    setEvents(safe);
  };
  const safeSetDeals = (value) => {
    const safe = normalizeApiArray(value, 'deals');
    setDeals(safe);
  };
  const safeSetContracts = (value) => {
    const safe = normalizeApiArray(value, 'contracts');
    setContracts(safe);
  };
  
  const [loading, setLoading] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [drawerBrandId, setDrawerBrandId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create"); // create | edit
  const [editorDraft, setEditorDraft] = useState({
    brandName: "",
    website: "",
    industry: "Other",
    status: "Prospect",
    lifecycleStage: "",
    relationshipStrength: "",
    primaryContactId: "",
    owner: ownerDefault,
    internalNotes: ""
  });

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        // Check if localStorage migration is needed
        const { hasData, counts } = await checkForLocalStorageData();
        if (hasData) {
          setMigrationNeeded(true);
          console.log("[CRM] LocalStorage data found:", counts);
        }

        // Fetch brands and contacts from API independently
        console.log('[CRM] Initial data load...');
        
        const brandsResult = await fetchBrands().catch(err => {
          console.error('[CRM] Failed to load brands:', err.message);
          throw err; // Brands are critical - fail hard
        });
        
        const contactsResult = await fetchContacts().catch(err => {
          console.warn('[CRM] Failed to load contacts (non-blocking):', err.message);
          return { contacts: [] }; // Contacts are optional - continue with empty array
        });

        // CRITICAL: Normalize API response to array format using shared helper
        const safeBrands = normalizeApiArrayWithGuard(brandsResult, 'brands', 'BRANDS CRM');
        const safeContacts = normalizeApiArrayWithGuard(contactsResult, 'contacts', 'BRANDS CRM');
        
        console.log('[CRM] Initial brands loaded:', safeBrands.length);
        console.log('[CRM] Initial contacts loaded:', safeContacts.length);
        
        safeSetBrands(safeBrands);
        safeSetContacts(safeContacts);
      } catch (error) {
        console.error("[CRM] Critical error loading brands:", error);
        alert('Failed to load CRM data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMigration = async () => {
    try {
      setLoading(true);
      const result = await migrateLocalStorageToDatabase();
      console.log("[CRM] Migration complete:", result);
      
      // Reload data independently
      const brandsResult = await fetchBrands().catch(err => {
        console.error('[CRM] Failed to reload brands after migration:', err.message);
        return { brands: [] };
      });
      
      const contactsResult = await fetchContacts().catch(err => {
        console.warn('[CRM] Failed to reload contacts after migration (non-blocking):', err.message);
        return { contacts: [] };
      });
      
      // Defensive: handle any unexpected API response shape
      const brandsData = brandsResult && typeof brandsResult === 'object' ? brandsResult.brands : null;
      const contactsData = contactsResult && typeof contactsResult === 'object' ? contactsResult.contacts : null;
      
      // Defensive: ensure arrays are always arrays
      const safeBrands = Array.isArray(brandsData) ? brandsData : [];
      const safeContacts = Array.isArray(contactsData) ? contactsData : [];
      
      if (!Array.isArray(brandsData) && brandsData !== null && brandsData !== undefined) {
        console.warn('[CRM] Unexpected brands response shape after migration:', { brandsResult, brandsData });
      }
      if (!Array.isArray(contactsData) && contactsData !== null && contactsData !== undefined) {
        console.warn('[CRM] Unexpected contacts response shape after migration:', { contactsResult, contactsData });
      }
      
      safeSetBrands(safeBrands);
      safeSetContacts(safeContacts);
      setMigrationNeeded(false);
    } catch (error) {
      console.error("[CRM] Migration failed:", error);
      alert("Migration failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      console.log('[CRM] Refreshing brands and contacts...');
      // Fetch brands and contacts independently - don't let contacts failure block brands
      const brandsResult = await fetchBrands().catch(err => {
        console.error('[CRM] Failed to fetch brands:', err.message);
        return { brands: brands || [] }; // Keep existing brands on failure
      });
      
      const contactsResult = await fetchContacts().catch(err => {
        console.warn('[CRM] Failed to fetch contacts (non-blocking):', err.message);
        return { contacts: contacts || [] }; // Keep existing contacts on failure
      });
      
      // CRITICAL: Normalize API response to array format using shared helper
      const safeBrands = normalizeApiArrayWithGuard(brandsResult, 'brands', 'BRANDS CRM');
      const safeContacts = normalizeApiArrayWithGuard(contactsResult, 'contacts', 'BRANDS CRM');
      
      console.log('[CRM] Fetched brands:', safeBrands.length);
      console.log('[CRM] Fetched contacts:', safeContacts.length);
      
      safeSetBrands(safeBrands);
      safeSetContacts(safeContacts);
    } catch (error) {
      console.error("[CRM] Unexpected error refreshing data:", error);
    }
  };

  // Ensure state is always an array before useMemo hooks
  // CRITICAL: Use normalizeApiArray (without guard) to avoid warnings for expected API shapes
  // The guard warnings are too noisy for normal API responses like { brands: [...] }
  const safeBrandsState = useMemo(() => {
    return normalizeApiArray(brands, 'brands');
  }, [brands]);
  const safeCampaignsState = useMemo(() => {
    return normalizeApiArray(campaigns, 'campaigns');
  }, [campaigns]);
  const safeEventsState = useMemo(() => {
    return normalizeApiArray(events, 'events');
  }, [events]);
  const safeDealsState = useMemo(() => {
    return normalizeApiArray(deals, 'deals');
  }, [deals]);
  const safeContractsState = useMemo(() => {
    return normalizeApiArray(contracts, 'contracts');
  }, [contracts]);
  const safeContactsState = useMemo(() => {
    return normalizeApiArray(contacts, 'contacts');
  }, [contacts]);

  const filtered = useMemo(() => {
    try {
      // Normalize once - safeBrandsState should already be normalized, but be defensive
      const brandsArray = normalizeApiArray(safeBrandsState);
      
      // Final safety check - ensure we have an array
      if (!Array.isArray(brandsArray)) {
        console.error('[BRANDS CRM] CRITICAL: brandsArray is not an array after normalization:', { 
          safeBrandsState, 
          brandsArray,
          type: typeof brandsArray,
          isArray: Array.isArray(brandsArray)
        });
        return [];
      }
      
      const q = query.trim().toLowerCase();
      return brandsArray
        .filter((b) => b && (statusFilter === "All" ? true : b.status === statusFilter))
        .filter((b) => (q ? `${b.brandName || ""} ${b.website || ""} ${b.industry || ""}`.toLowerCase().includes(q) : true))
        .sort((a, b) => (b.lastActivityAt || a.createdAt || "").localeCompare(a.lastActivityAt || a.createdAt || ""));
    } catch (error) {
      console.error('[BRANDS CRM] Error in filtered useMemo:', error, { 
        safeBrandsState, 
        type: typeof safeBrandsState,
        isArray: Array.isArray(safeBrandsState),
        query, 
        statusFilter 
      });
      return [];
    }
  }, [safeBrandsState, query, statusFilter]);

  const selectedBrand = useMemo(() => {
    if (!drawerBrandId) return null;
    // CRITICAL: Ensure safeBrandsState is an array before calling .find()
    const brandsArray = normalizeApiArray(safeBrandsState);
    return brandsArray.find((b) => b && b.id === drawerBrandId) || null;
  }, [safeBrandsState, drawerBrandId]);
  const brandCampaigns = useMemo(() => {
    if (!selectedBrand || !selectedBrand.id) return [];
    try {
      // CRITICAL: Double-normalize to handle any edge cases (defense in depth)
      const campaigns = normalizeApiArray(safeCampaignsState);
      return campaigns
        .filter((c) => c && c.brandId === selectedBrand.id)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } catch (error) {
      console.error('[BRANDS PAGE] Error in brandCampaigns useMemo:', error, { safeCampaignsState, selectedBrand });
      return [];
    }
  }, [safeCampaignsState, selectedBrand]);
  const brandEvents = useMemo(() => {
    if (!selectedBrand || !selectedBrand.id) return [];
    try {
      // CRITICAL: Double-normalize to handle any edge cases (defense in depth)
      const events = normalizeApiArray(safeEventsState);
      return events
        .filter((e) => e && e.brandId === selectedBrand.id)
        .sort((a, b) => String(b.startDateTime || "").localeCompare(String(a.startDateTime || "")));
    } catch (error) {
      console.error('[BRANDS PAGE] Error in brandEvents useMemo:', error, { safeEventsState, selectedBrand });
      return [];
    }
  }, [safeEventsState, selectedBrand]);
  const brandDeals = useMemo(() => {
    if (!selectedBrand || !selectedBrand.id) return [];
    try {
      // CRITICAL: Double-normalize to handle any edge cases (defense in depth)
      const deals = normalizeApiArray(safeDealsState);
      return deals
        .filter((d) => d && d.brandId === selectedBrand.id)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch (error) {
      console.error('[BRANDS PAGE] Error in brandDeals useMemo:', error, { safeDealsState, selectedBrand });
      return [];
    }
  }, [safeDealsState, selectedBrand]);
  const brandContracts = useMemo(() => {
    if (!selectedBrand || !selectedBrand.id) return [];
    try {
      // CRITICAL: Double-normalize to handle any edge cases (defense in depth)
      const contracts = normalizeApiArray(safeContractsState);
      return contracts
        .filter((c) => c && c.brandId === selectedBrand.id)
        .sort((a, b) => String(b.lastUpdatedAt || b.createdAt || "").localeCompare(String(a.lastUpdatedAt || a.createdAt || "")));
    } catch (error) {
      console.error('[BRANDS PAGE] Error in brandContracts useMemo:', error, { safeContractsState, selectedBrand });
      return [];
    }
  }, [safeContractsState, selectedBrand]);
  const brandContacts = useMemo(() => {
    if (!selectedBrand || !selectedBrand.id) return [];
    try {
      // CRITICAL: Double-normalize to handle any edge cases (defense in depth)
      const contacts = normalizeApiArray(safeContactsState);
      
      // Runtime guard: Warn if safeContactsState is not an array
      if (!Array.isArray(safeContactsState)) {
        console.warn('[BRANDS CRM] safeContactsState is not an array in brandContacts useMemo:', { 
          safeContactsState, 
          type: typeof safeContactsState,
          isArray: Array.isArray(safeContactsState),
          value: safeContactsState
        });
      }
      
      return contacts
        .filter((c) => c && c.brandId === selectedBrand.id)
        .sort((a, b) => {
          if (Boolean(b.primaryContact) !== Boolean(a.primaryContact)) return b.primaryContact ? 1 : -1;
          return `${a.lastName || ""} ${a.firstName || ""}`.localeCompare(`${b.lastName || ""} ${b.firstName || ""}`);
        });
    } catch (error) {
      console.error('[BRANDS CRM] Error in brandContacts useMemo:', error, { 
        safeContactsState, 
        type: typeof safeContactsState,
        isArray: Array.isArray(safeContactsState),
        selectedBrand 
      });
      return [];
    }
  }, [safeContactsState, selectedBrand]);

  const [contactDrawerId, setContactDrawerId] = useState("");
  const selectedContact = useMemo(
    () => {
      // CRITICAL: Ensure safeContactsState is an array before calling .find()
      const contactsArray = normalizeApiArray(safeContactsState);
      return contactsArray.find((c) => c && c.id === contactDrawerId) || null;
    },
    [safeContactsState, contactDrawerId]
  );

  // Ensure all state variables are always arrays (safety net)
  useEffect(() => {
    if (!Array.isArray(campaigns)) {
      console.warn('[BRANDS PAGE] campaigns is not an array, resetting to []', { campaigns, type: typeof campaigns, isArray: Array.isArray(campaigns) });
      safeSetCampaigns([]);
    }
    if (!Array.isArray(events)) {
      console.warn('[BRANDS PAGE] events is not an array, resetting to []', { events, type: typeof events, isArray: Array.isArray(events) });
      safeSetEvents([]);
    }
    if (!Array.isArray(deals)) {
      console.warn('[BRANDS PAGE] deals is not an array, resetting to []', { deals, type: typeof deals, isArray: Array.isArray(deals) });
      safeSetDeals([]);
    }
    if (!Array.isArray(contracts)) {
      console.warn('[BRANDS PAGE] contracts is not an array, resetting to []', { contracts, type: typeof contracts, isArray: Array.isArray(contracts) });
      safeSetContracts([]);
    }
    if (!Array.isArray(contacts)) {
      console.warn('[BRANDS PAGE] contacts is not an array, resetting to []', { contacts, type: typeof contacts, isArray: Array.isArray(contacts) });
      safeSetContacts([]);
    }
    if (!Array.isArray(brands)) {
      console.warn('[BRANDS PAGE] brands is not an array, resetting to []', { brands, type: typeof brands, isArray: Array.isArray(brands) });
      safeSetBrands([]);
    }
  }, [campaigns, events, deals, contracts, contacts, brands]);

  useEffect(() => {
    if (!drawerBrandId) return;
    // Load related data from API when drawer opens
    async function loadRelatedData() {
      try {
        const [campaignsData, eventsData, dealsData, contractsData] = await Promise.all([
          fetchCampaigns({ brandId: drawerBrandId }).catch(err => {
            console.warn('[BRANDS PAGE] Failed to fetch campaigns:', err);
            return "";
          }),
          fetchEvents({ brandId: drawerBrandId }).catch(err => {
            console.warn('[BRANDS PAGE] Failed to fetch events:', err);
            return "";
          }),
          fetchDeals({ brandId: drawerBrandId }).catch(err => {
            console.warn('[BRANDS PAGE] Failed to fetch deals:', err);
            return "";
          }),
          fetchContracts({ brandId: drawerBrandId }).catch(err => {
            console.warn('[BRANDS PAGE] Failed to fetch contracts:', err);
            return "";
          }),
        ]);
        
        // Use shared helper to normalize API responses
        const campaignsArray = normalizeApiArrayWithGuard(campaignsData, 'campaigns', 'BRANDS CRM');
        const eventsArray = normalizeApiArrayWithGuard(eventsData, 'events', 'BRANDS CRM');
        const dealsArray = normalizeApiArrayWithGuard(dealsData, 'deals', 'BRANDS CRM');
        const contractsArray = normalizeApiArrayWithGuard(contractsData, 'contracts', 'BRANDS CRM');
        
        safeSetCampaigns(campaignsArray);
        safeSetEvents(eventsArray);
        safeSetDeals(dealsArray);
        safeSetContracts(contractsArray);
      } catch (error) {
        console.error("[BRANDS PAGE] Failed to load related data:", error);
        // Ensure arrays are set even on error
        safeSetCampaigns([]);
        safeSetEvents([]);
        safeSetDeals([]);
        safeSetContracts([]);
      }
    }
    loadRelatedData();
  }, [drawerBrandId]);
  const [contactEditorOpen, setContactEditorOpen] = useState(false);
  const [contactEditorMode, setContactEditorMode] = useState("create"); // create | edit
  const [contactEditorBrandId, setContactEditorBrandId] = useState("");
  const [contactDraft, setContactDraft] = useState({
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    relationshipStatus: "New",
    preferredContactMethod: "",
    primaryContact: false,
    owner: ownerDefault
  });
  const [contactNoteDraft, setContactNoteDraft] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const resetCopied = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => setCopiedField(""), 1500);
  };
  const copyToClipboard = async (value, key) => {
    const text = (value || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedField(key);
      resetCopied();
    } catch {
      // ignore
    }
  };

  const openCreate = () => {
    setEditorMode("create");
    setEditorDraft({
      brandName: "",
      website: "",
      logo: "",
      industry: "Other",
      status: "Prospect",
      lifecycleStage: "",
      relationshipStrength: "",
      primaryContactId: "",
      owner: ownerDefault,
      internalNotes: ""
    });
    setEditorOpen(true);
  };

  const openEdit = (brand) => {
    setEditorMode("edit");
    setEditorDraft({
      brandName: brand.brandName || "",
      website: brand.website || "",
      logo: brand.logo || "",
      industry: brand.industry || "Other",
      status: brand.status || "Prospect",
      lifecycleStage: brand.lifecycleStage || "",
      relationshipStrength: brand.relationshipStrength || "",
      primaryContactId: brand.primaryContactId || "",
      owner: brand.owner || ownerDefault,
      internalNotes: brand.internalNotes || ""
    });
    setEditorOpen(true);
  };

  const upsert = async () => {
    const name = editorDraft.brandName.trim();
    if (!name) {
      alert('Brand name is required');
      return;
    }
    if (editorMode === "create") {
      try {
        setLoading(true);
        const brandData = {
          brandName: name,
          website: editorDraft.website.trim(),
          logo: editorDraft.logo.trim(),
          industry: editorDraft.industry,
          status: editorDraft.status,
          lifecycleStage: editorDraft.lifecycleStage || null,
          relationshipStrength: editorDraft.relationshipStrength || null,
          primaryContactId: editorDraft.primaryContactId || null,
          internalNotes: editorDraft.internalNotes,
          owner: editorDraft.owner || ownerDefault
        };
        console.log('[BRAND CREATE] Submitting brand data:', brandData);
        const response = await createBrand(brandData);
        console.log('[BRAND CREATE] API response:', response);
        
        // API returns { brand: { id, ... } }
        const newBrand = response.brand;
        if (!newBrand || !newBrand.id) {
          throw new Error('Invalid response from server');
        }
        
        console.log('[BRAND CREATE] Brand created successfully:', newBrand.id);
        await refreshData();
        console.log('[BRAND CREATE] Data refreshed, closing drawer');
        setEditorOpen(false);
        setDrawerBrandId(newBrand.id);
      } catch (error) {
        console.error('[BRAND CREATE] Failed to create brand:', error);
        alert('Failed to create brand: ' + (error.message || 'Please try again.'));
      } finally {
        setLoading(false);
      }
      return;
    }
    const targetId = drawerBrandId || (selectedBrand ? selectedBrand.id : "");
    try {
      setLoading(true);
      const brandData = {
        brandName: name,
        website: editorDraft.website.trim(),
        logo: editorDraft.logo.trim(),
        industry: editorDraft.industry,
        status: editorDraft.status,
        lifecycleStage: editorDraft.lifecycleStage || null,
        relationshipStrength: editorDraft.relationshipStrength || null,
        primaryContactId: editorDraft.primaryContactId || null,
        internalNotes: editorDraft.internalNotes,
        owner: editorDraft.owner || ownerDefault
      };
      await updateBrand(targetId, brandData);
      await refreshData();
      setEditorOpen(false);
    } catch (error) {
      console.error('Failed to update brand:', error);
      alert('Failed to update brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (brandId) => setDrawerBrandId(brandId);

  const openContactCreate = (brandId) => {
    setContactEditorMode("create");
    setContactEditorBrandId(brandId);
    setContactDraft({
      firstName: "",
      lastName: "",
      role: "",
      email: "",
      phone: "",
      linkedInUrl: "",
      relationshipStatus: "New",
      preferredContactMethod: "",
      primaryContact: false,
      owner: ownerDefault
    });
    setContactEditorOpen(true);
  };

  const openContactEdit = (contact) => {
    setContactEditorMode("edit");
    setContactEditorBrandId(contact.brandId);
    setContactDraft({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      role: contact.role || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedInUrl: contact.linkedInUrl || "",
      relationshipStatus: contact.relationshipStatus || "New",
      preferredContactMethod: contact.preferredContactMethod || "",
      primaryContact: Boolean(contact.primaryContact),
      owner: contact.owner || ownerDefault
    });
    setContactEditorOpen(true);
  };

  const upsertContact = async () => {
    const firstName = contactDraft.firstName.trim();
    const lastName = contactDraft.lastName.trim();
    if (!firstName || !lastName) return;
    const brandId = contactEditorBrandId || selectedBrand?.id || "";
    if (!brandId) return;
    if (contactEditorMode === "create") {
      try {
        setLoading(true);
        const contactData = {
          brandId,
          firstName,
          lastName,
          role: contactDraft.role.trim(),
          email: contactDraft.email.trim(),
          phone: contactDraft.phone.trim(),
          linkedInUrl: contactDraft.linkedInUrl.trim(),
          relationshipStatus: contactDraft.relationshipStatus,
          preferredContactMethod: contactDraft.preferredContactMethod,
          primaryContact: Boolean(contactDraft.primaryContact),
          owner: contactDraft.owner || ownerDefault
        };
        const response = await createContact(contactData);
        const newContact = response.contact; // Extract contact from response
        if (!newContact || !newContact.id) {
          throw new Error('Invalid response from server');
        }
        await refreshData();
        setContactEditorOpen(false);
        setContactDrawerId(newContact.id);
      } catch (error) {
        console.error('Failed to create contact:', error);
        alert('Failed to create contact. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    const targetId = contactDrawerId || (selectedContact ? selectedContact.id : "");
    if (!targetId) return;
    try {
      setLoading(true);
      const contactData = {
        firstName,
        lastName,
        role: contactDraft.role.trim(),
        email: contactDraft.email.trim(),
        phone: contactDraft.phone.trim(),
        linkedInUrl: contactDraft.linkedInUrl.trim(),
        relationshipStatus: contactDraft.relationshipStatus,
        preferredContactMethod: contactDraft.preferredContactMethod,
        primaryContact: Boolean(contactDraft.primaryContact),
        owner: contactDraft.owner || ownerDefault
      };
      await updateContact(targetId, contactData);
      await refreshData();
      setContactEditorOpen(false);
    } catch (error) {
      console.error('Failed to update contact:', error);
      alert('Failed to update contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addContactNote = async (contactId, text) => {
    const note = (text || "").trim();
    if (!note) return;
    try {
      setLoading(true);
      await addContactNoteAPI(contactId, note, ownerDefault);
      await refreshData();
      setContactNoteDraft("");
    } catch (error) {
      console.error('Failed to add contact note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (brand) => {
    setBrandToDelete(brand);
    setDeleteModalOpen(true);
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    try {
      setLoading(true);
      await deleteBrand(brandToDelete.id);
      await refreshData();
      setDeleteModalOpen(false);
      setBrandToDelete(null);
      setDrawerBrandId("");
    } catch (error) {
      console.error('[BRAND DELETE] Failed to delete brand:', error);
      alert('Failed to delete brand: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const getLinkedObjectsSummary = (brand) => {
    if (!brand) return { total: 0, campaigns: 0, deals: 0, events: 0, contracts: 0, outreach: 0 };
    // Defensive: ensure all states are arrays before calling filter
    // Double-normalize to handle any edge cases (defense in depth)
    try {
      const campaignsArray = normalizeApiArray(safeCampaignsState);
      const dealsArray = normalizeApiArray(safeDealsState);
      const eventsArray = normalizeApiArray(safeEventsState);
      const contractsArray = normalizeApiArray(safeContractsState);
      
      const campaignCount = campaignsArray.filter(c => c && c.brandId === brand.id).length;
      const dealCount = dealsArray.filter(d => d && d.brandId === brand.id).length;
      const eventCount = eventsArray.filter(e => e && e.brandId === brand.id).length;
      const contractCount = contractsArray.filter(c => c && c.brandId === brand.id).length;
      const outreachCount = brand._count?.OutreachRecords || 0;
      return {
        total: campaignCount + dealCount + eventCount + contractCount + outreachCount,
        campaigns: campaignCount,
        deals: dealCount,
        events: eventCount,
        contracts: contractCount,
        outreach: outreachCount,
      };
    } catch (error) {
      console.error('[BRANDS PAGE] Error in getLinkedObjectsSummary:', error, { brand, safeCampaignsState, safeDealsState, safeEventsState, safeContractsState });
      return { total: 0, campaigns: 0, deals: 0, events: 0, contracts: 0, outreach: 0 };
    }
  };

  const enrichWebsite = async (websiteUrl) => {
    if (!websiteUrl || enriching) return;
    
    // Don't enrich if logo is already manually entered
    if (editorDraft.logo) {
      console.log('[ENRICHMENT] Skipping - logo already set');
      return;
    }

    setEnriching(true);
    setEnrichmentSuggestion(null);

    try {
      // Try to fetch favicon/logo from the website
      const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      const domain = new URL(url).hostname;
      
      // Try multiple favicon sources
      const faviconSources = [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `${url}/favicon.ico`,
        `https://logo.clearbit.com/${domain}`
      ];

      // Test first source (Google favicons is most reliable)
      const logoUrl = faviconSources[0];
      
      // Show suggestion (non-blocking, user can accept or ignore)
      setEnrichmentSuggestion({ logo: logoUrl });
      console.log('[ENRICHMENT] Suggested logo:', logoUrl);
    } catch (error) {
      console.warn('[ENRICHMENT] Failed to enrich website:', error);
      // Silent failure - don't block user
    } finally {
      setEnriching(false);
    }
  };

  const applyEnrichmentSuggestion = () => {
    if (!enrichmentSuggestion) return;
    if (enrichmentSuggestion.logo && !editorDraft.logo) {
      setEditorDraft(prev => ({ ...prev, logo: enrichmentSuggestion.logo }));
    }
    setEnrichmentSuggestion(null);
  };

  const dismissEnrichmentSuggestion = () => {
    setEnrichmentSuggestion(null);
  };

  // Final safety check before render - ensure all state is valid
  if (!Array.isArray(brands) || !Array.isArray(contacts) || !Array.isArray(campaigns) || !Array.isArray(events) || !Array.isArray(deals) || !Array.isArray(contracts)) {
    console.error('[BRANDS PAGE] Invalid state detected before render:', {
      brands: Array.isArray(brands),
      contacts: Array.isArray(contacts),
      campaigns: Array.isArray(campaigns),
      events: Array.isArray(events),
      deals: Array.isArray(deals),
      contracts: Array.isArray(contracts)
    });
    // Force reset all state to arrays
    if (!Array.isArray(brands)) safeSetBrands([]);
    if (!Array.isArray(contacts)) safeSetContacts([]);
    if (!Array.isArray(campaigns)) safeSetCampaigns([]);
    if (!Array.isArray(events)) safeSetEvents([]);
    if (!Array.isArray(deals)) safeSetDeals([]);
    if (!Array.isArray(contracts)) safeSetContracts([]);
    // Return loading state while we fix the state
    return (
      <DashboardShell title="Brands" subtitle="Track brands as long-lived CRM entities — without login assumptions." role="admin" navLinks={ADMIN_NAV_LINKS}>
        <div className="flex items-center justify-center p-12">
          <p className="text-sm text-brand-black/60">Loading brands...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Brands" subtitle="Track brands as long-lived CRM entities — without login assumptions." role="admin" navLinks={ADMIN_NAV_LINKS}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Brands</p>
              <h2 className="font-display text-3xl uppercase text-brand-black">Brand CRM</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-black/70">
                Track every brand relationship — past, present, and future. Link brands to deals, campaigns, and contacts for complete visibility.
              </p>
            </div>
            <PrimaryButton onClick={openCreate}>Add brand</PrimaryButton>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70 focus-within:border-brand-red/30 focus-within:ring-2 focus-within:ring-brand-red/10 transition-colors">
              <span className="text-brand-black/60">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Brand name, website, industry…"
                className="w-56 bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none placeholder:text-brand-black/30"
              />
            </label>
            <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70 focus-within:border-brand-red/30 focus-within:ring-2 focus-within:ring-brand-red/10 transition-colors">
              <span className="text-brand-black/60">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none cursor-pointer"
              >
                {["All", ...BRAND_STATUSES].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {(query || statusFilter !== "All") && (
              <TextButton
                onClick={() => {
                  setQuery("");
                  setStatusFilter("All");
                }}
                className="text-xs"
              >
                Clear filters
              </TextButton>
            )}
          </div>
        </section>

        {(!Array.isArray(filtered) || filtered.length === 0) ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <section className="space-y-4">
            {filtered.map((brand) => {
              const hints = deriveHint(brand);
              return (
                <article
                  key={brand.id}
                  className="cursor-pointer rounded-3xl border border-brand-black/10 bg-brand-white p-6 transition hover:-translate-y-0.5 hover:bg-brand-linen/20 hover:shadow-[0_25px_80px_rgba(0,0,0,0.08)]"
                  onClick={() => openDrawer(brand.id)}
                >
                  <div className="flex items-start gap-4">
                    <BrandAvatar name={brand.brandName} logo={brand.logo} logoUrl={brand.logoUrl} size="md" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-2">
                        <h3 className="font-display text-xl uppercase text-brand-black">{brand.brandName}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="neutral">{brand.industry || "Other"}</Pill>
                          <Pill tone={brand.status === "Active" ? "positive" : "neutral"}>{brand.status}</Pill>
                          {hints.map((h) => (
                            <Pill key={h} tone="neutral">
                              {h}
                            </Pill>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-brand-black/60">
                        <span>Owner: <span className="font-semibold text-brand-black/80">{brand.owner || "—"}</span></span>
                        <span className="text-brand-black/20">•</span>
                        <span>Last activity: <span className="font-semibold text-brand-black/80">{shortActivity(brand.lastActivityLabel)}</span></span>
                        <span className="text-brand-black/20">•</span>
                        <span className="text-brand-black/50">{formatWhen(brand.lastActivityAt)}</span>
                      </div>
                      {brand.website ? (
                        <a
                          className="block truncate text-sm text-brand-black/60 underline underline-offset-4 hover:text-brand-black"
                          href={toExternalUrl(brand.website)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {brand.website}
                        </a>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <TextButton onClick={() => openDrawer(brand.id)}>Open</TextButton>
                      <ActionsMenu
                        onOpen={() => openDrawer(brand.id)}
                        onEdit={() => {
                          setDrawerBrandId(brand.id);
                          openEdit(brand);
                        }}
                        onDelete={() => openDeleteModal(brand)}
                        isSuperadmin={isSuperadmin}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <Drawer
        open={Boolean(selectedBrand)}
        title={selectedBrand?.brandName || "Brand"}
        onClose={() => setDrawerBrandId("")}
        actions={
          selectedBrand ? (
            <TextButton
              onClick={() => {
                setDrawerBrandId(selectedBrand.id);
                openEdit(selectedBrand);
              }}
            >
              Edit
            </TextButton>
          ) : null
        }
      >
        {selectedBrand ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <div className="mb-5 flex items-center gap-3">
                <BrandAvatar name={selectedBrand.brandName} logo={selectedBrand.logo} logoUrl={selectedBrand.logoUrl} size="lg" />
                <div>
                  <h4 className="font-display text-xl uppercase text-brand-black">{selectedBrand.brandName}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Pill tone="neutral">{selectedBrand.industry || "Other"}</Pill>
                    <Pill tone={selectedBrand.status === "Active" ? "positive" : "neutral"}>{selectedBrand.status}</Pill>
                  </div>
                </div>
              </div>
              
              {selectedBrand.about && (
                <div className="mb-5 rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60 mb-2">About</p>
                  <p className="text-sm text-brand-black/80 leading-relaxed">{selectedBrand.about}</p>
                </div>
              )}
              
              {selectedBrand.socialLinks && Object.keys(selectedBrand.socialLinks).length > 0 && (
                <div className="mb-5 rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60 mb-2">Social Links</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBrand.socialLinks.instagram && (
                      <a
                        href={selectedBrand.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-red hover:underline"
                      >
                        Instagram
                      </a>
                    )}
                    {selectedBrand.socialLinks.linkedin && (
                      <a
                        href={selectedBrand.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-red hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                    {selectedBrand.socialLinks.tiktok && (
                      <a
                        href={selectedBrand.socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-red hover:underline"
                      >
                        TikTok
                      </a>
                    )}
                    {selectedBrand.socialLinks.twitter && (
                      <a
                        href={selectedBrand.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-red hover:underline"
                      >
                        Twitter
                      </a>
                    )}
                    {selectedBrand.socialLinks.facebook && (
                      <a
                        href={selectedBrand.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-red hover:underline"
                      >
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Overview</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Industry</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand.industry || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Status</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand.status}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Lifecycle stage</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand.lifecycleStage || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Relationship</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand.relationshipStrength || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Owner</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand.owner || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Primary contact</p>
                  <p className="mt-2 text-sm text-brand-black/80">
                    {selectedBrand.primaryContactId
                      ? (() => {
                          const safeContacts = Array.isArray(brandContacts) ? brandContacts : [];
                          const contact = safeContacts.find(c => c && c.id === selectedBrand.primaryContactId);
                          return contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "—" : "—";
                        })()
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Created</p>
                  <p className="mt-2 text-sm text-brand-black/80">{formatWhen(selectedBrand.createdAt)}</p>
                </div>
              </div>
              {selectedBrand.website ? (
                <a
                  className="mt-4 block rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3 text-sm text-brand-black/70 underline underline-offset-4 hover:text-brand-black"
                  href={toExternalUrl(selectedBrand.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selectedBrand.website}
                </a>
              ) : null}
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Internal notes</p>
                <p className="mt-2 text-sm text-brand-black/70">
                  {selectedBrand.internalNotes?.trim()
                    ? selectedBrand.internalNotes.trim()
                    : "Add calm internal context — this never appears to brands."}
                </p>
              </div>
            </section>

            <NotesIntelligenceSection
              context={{ brandId: selectedBrand.id }}
              session={session}
              title="Notes & intelligence"
              subtitle="Private margin notes — preferences, nuance, and learnings."
            />

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Linked CRM objects</p>
                  <p className="mt-1 text-sm text-brand-black/60">Read-only lists for now. Links come later.</p>
                </div>
                <Pill tone="neutral">CRM-native</Pill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { label: "Deals", count: brandDeals.length },
                  { label: "Tasks", count: selectedBrand.linkedTasksCount || 0 },
                  { label: "Campaigns", count: brandCampaigns.length },
                  { label: "Events", count: brandEvents.length },
                  { label: "Contracts", count: brandContracts.length },
                  { label: "Outreach history", count: 0 },
                  { label: "Invoices", count: 0 }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-black">{item.label}</p>
                      <Pill tone="neutral">{item.count}</Pill>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70"
                        title="Coming soon"
                      >
                        View all
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70"
                        title="Coming soon"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Campaigns</p>
                  <p className="mt-1 text-sm text-brand-black/60">Time-bound activations tied to this brand.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">{brandCampaigns.length}</Pill>
                  <PrimaryButton
                    onClick={() => navigate(`/admin/campaigns?create=1&brandId=${encodeURIComponent(selectedBrand.id)}`)}
                  >
                    Create campaign
                  </PrimaryButton>
                </div>
              </div>
              {brandCampaigns.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <p className="text-sm font-medium text-brand-black/80 mb-1">No campaigns yet</p>
                  <p className="text-xs text-brand-black/60 leading-relaxed">
                    Group deals, talent, and events into campaigns to manage activations clearly.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {brandCampaigns.slice(0, 6).map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CampaignChip name={campaign.campaignName} status={campaign.status} size="sm" />
                          <Pill tone="neutral">{campaign.campaignType}</Pill>
                          {campaign.startDate || campaign.endDate ? (
                            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
                              {formatCampaignDateRange({ startDate: campaign.startDate, endDate: campaign.endDate })}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-brand-black/60">
                          Latest: {campaign.activity?.[0]?.label || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TextButton onClick={() => navigate(`/admin/campaigns?open=${encodeURIComponent(campaign.id)}`)}>
                          Open
                        </TextButton>
                      </div>
                    </div>
                  ))}
                  {brandCampaigns.length > 6 ? (
                    <div className="pt-2">
                      <TextButton onClick={() => navigate("/admin/campaigns")}>View all campaigns</TextButton>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Deals</p>
                  <p className="mt-1 text-sm text-brand-black/60">Commercial spine. Every deal belongs to this brand.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">{brandDeals.length}</Pill>
                  <PrimaryButton
                    onClick={() => navigate(`/admin/deals?create=1&brandId=${encodeURIComponent(selectedBrand.id)}`)}
                  >
                    Create deal
                  </PrimaryButton>
                </div>
              </div>
              {brandDeals.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <p className="text-sm font-medium text-brand-black/80 mb-1">No deals yet</p>
                  <p className="text-xs text-brand-black/60 leading-relaxed">
                    Deals are how revenue flows through the platform — every deal belongs to a brand.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {brandDeals.slice(0, 6).map((deal) => (
                    <div
                      key={deal.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <DealChip name={deal.dealName} status={deal.status} size="sm" />
                          <Pill tone="neutral">{deal.estimatedValueBand || "£"}</Pill>
                          <Pill tone="neutral">{deal.status}</Pill>
                        </div>
                        <p className="mt-2 text-xs text-brand-black/60">
                          Latest: {deal.activity?.[0]?.label || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TextButton onClick={() => navigate(`/admin/deals?open=${encodeURIComponent(deal.id)}`)}>
                          Open
                        </TextButton>
                      </div>
                    </div>
                  ))}
                  {brandDeals.length > 6 ? (
                    <div className="pt-2">
                      <TextButton onClick={() => navigate(`/admin/deals?brandId=${encodeURIComponent(selectedBrand.id)}`)}>
                        View all
                      </TextButton>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Documents / contracts</p>
                  <p className="mt-1 text-sm text-brand-black/60">Status + timing first. Files come later.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">{brandContracts.length}</Pill>
                  <PrimaryButton
                    onClick={() => navigate(`/admin/documents?create=1&brandId=${encodeURIComponent(selectedBrand.id)}`)}
                  >
                    Add contract
                  </PrimaryButton>
                </div>
              </div>
              {brandContracts.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <p className="text-sm font-medium text-brand-black/80 mb-1">No contracts yet</p>
                  <p className="text-xs text-brand-black/60 leading-relaxed mb-2">
                    Contracts link deals, brands, and talent — and power renewals and tasks later.
                  </p>
                  <p className="text-xs text-brand-black/50 leading-relaxed">
                    Contracts require a linked deal; create a deal first, then attach the contract.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {brandContracts.slice(0, 6).map((contract) => {
                    const risk = computeExpiryRisk({ endDate: contract.endDate, status: contract.status });
                    const riskTone = risk === "High" ? "bg-brand-red/10 text-brand-red" : "bg-brand-black/5 text-brand-black";
                    return (
                      <div
                        key={contract.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <ContractChip name={contract.contractName} status={contract.status} size="sm" />
                            <Pill tone="neutral">{contract.contractType}</Pill>
                            <span className={`rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${riskTone}`}>
                              {risk} risk
                            </span>
                            {contract.endDate ? (
                              <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
                                Ends: {formatContractEndDate(contract.endDate)}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs text-brand-black/60">
                            Latest: {contract.activity?.[0]?.label || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <TextButton onClick={() => navigate(`/admin/documents?open=${encodeURIComponent(contract.id)}`)}>
                            Open
                          </TextButton>
                        </div>
                      </div>
                    );
                  })}
                  {brandContracts.length > 6 ? (
                    <div className="pt-2">
                      <TextButton onClick={() => navigate(`/admin/documents?brandId=${encodeURIComponent(selectedBrand.id)}`)}>
                        View all
                      </TextButton>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Events</p>
                  <p className="mt-1 text-sm text-brand-black/60">Intentional moments: dinners, trips, panels, previews.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">{brandEvents.length}</Pill>
                  <PrimaryButton
                    onClick={() => navigate(`/admin/events?create=1&brandId=${encodeURIComponent(selectedBrand.id)}`)}
                  >
                    Create event
                  </PrimaryButton>
                </div>
              </div>
              {brandEvents.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <p className="text-sm font-medium text-brand-black/80 mb-1">No events yet</p>
                  <p className="text-xs text-brand-black/60 leading-relaxed">
                    Add brand moments to keep prep, attendance, and follow-up calm and visible.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {brandEvents.slice(0, 6).map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <EventChip name={event.eventName} status={event.status} size="sm" />
                          <Pill tone="neutral">{event.eventType}</Pill>
                          {event.startDateTime ? (
                            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
                              {formatEventDateTimeRange({ startDateTime: event.startDateTime, endDateTime: event.endDateTime })}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-brand-black/60">
                          Latest: {event.activity?.[0]?.label || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TextButton onClick={() => navigate(`/admin/events?open=${encodeURIComponent(event.id)}`)}>
                          Open
                        </TextButton>
                      </div>
                    </div>
                  ))}
                  {brandEvents.length > 6 ? (
                    <div className="pt-2">
                      <TextButton onClick={() => navigate(`/admin/events?brandId=${encodeURIComponent(selectedBrand.id)}&view=upcoming`)}>
                        View all
                      </TextButton>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Activity timeline</p>
                  <p className="mt-1 text-sm text-brand-black/60">A simple audit trail. No technical logs.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {(Array.isArray(selectedBrand.activity) ? selectedBrand.activity : []).slice(0, 12).map((entry) => (
                  <div key={`${entry.at}-${entry.label}`} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
                    <p className="text-sm text-brand-black/80">{entry.label}</p>
                    <p className="mt-1 text-xs text-brand-black/60">{formatWhen(entry.at)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Outreach</p>
                  <p className="mt-1 text-sm text-brand-black/60">Chronological touchpoints — calm, not inbox-like.</p>
                </div>
              </div>
              <div className="mt-4">
                <OutreachRecordsPanel
                  session={session}
                  mode="embedded"
                  filter={{ brandId: selectedBrand.id }}
                  limit={6}
                  title="Outreach timeline"
                  subtitle=""
                />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Contacts</p>
                  <p className="mt-1 text-sm text-brand-black/60">People at this brand. Internal-only.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="neutral">{(Array.isArray(brandContacts) ? brandContacts : []).length}</Pill>
                  <PrimaryButton onClick={() => openContactCreate(selectedBrand.id)}>Add contact</PrimaryButton>
                </div>
              </div>
              {(Array.isArray(brandContacts) ? brandContacts : []).length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <p className="text-sm font-medium text-brand-black/80 mb-1">No contacts yet</p>
                  <p className="text-xs text-brand-black/60 leading-relaxed">
                    Add marketing, partnerships, PR, founders, or assistants so outreach and deals stay contextual.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {(Array.isArray(brandContacts) ? brandContacts : []).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ContactChip
                            firstName={contact.firstName}
                            lastName={contact.lastName}
                            status={contact.relationshipStatus}
                            primary={Boolean(contact.primaryContact)}
                          />
                          {contact.role ? <Pill tone="neutral">{contact.role}</Pill> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-black/60">
                          {contact.email ? <span className="truncate">{contact.email}</span> : <span>Email: —</span>}
                          <span className="text-brand-black/30">•</span>
                          <span>Preferred: <span className="font-semibold text-brand-black">{contact.preferredContactMethod || "—"}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TextButton onClick={() => setContactDrawerId(contact.id)}>Open</TextButton>
                        <ContactActionsMenu
                          onView={() => setContactDrawerId(contact.id)}
                          onEdit={() => {
                            setContactDrawerId(contact.id);
                            openContactEdit(contact);
                          }}
                          onAddNote={() => setContactDrawerId(contact.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(selectedContact)}
        title={selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : "Contact"}
        onClose={() => setContactDrawerId("")}
        actions={
          selectedContact ? (
            <TextButton
              onClick={() => {
                setContactDrawerId(selectedContact.id);
                openContactEdit(selectedContact);
              }}
            >
              Edit
            </TextButton>
          ) : null
        }
      >
        {selectedContact ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Overview</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Brand</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand?.brandName || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Relationship</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedContact.relationshipStatus || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Preferred contact</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedContact.preferredContactMethod || "—"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Owner</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedContact.owner || "—"}</p>
                </div>
              </div>
              {selectedContact.primaryContact ? (
                <div className="mt-4">
                  <Pill tone="positive">Primary contact</Pill>
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Contact info</p>
                  <p className="mt-1 text-sm text-brand-black/60">Copy details without leaving the control room.</p>
                </div>
                <Pill tone="neutral">Internal</Pill>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Email</p>
                    <p className="mt-1 truncate text-sm text-brand-black/80">{selectedContact.email || "—"}</p>
                  </div>
                  <TextButton onClick={() => copyToClipboard(selectedContact.email, "email")}>
                    {copiedField === "email" ? "Copied" : "Copy"}
                  </TextButton>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Phone</p>
                    <p className="mt-1 truncate text-sm text-brand-black/80">{selectedContact.phone || "—"}</p>
                  </div>
                  <TextButton onClick={() => copyToClipboard(selectedContact.phone, "phone")}>
                    {copiedField === "phone" ? "Copied" : "Copy"}
                  </TextButton>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">LinkedIn</p>
                    {selectedContact.linkedInUrl ? (
                      <a
                        className="mt-1 block truncate text-sm text-brand-black/70 underline underline-offset-4 hover:text-brand-black"
                        href={toExternalUrl(selectedContact.linkedInUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedContact.linkedInUrl}
                      </a>
                    ) : (
                      <p className="mt-1 truncate text-sm text-brand-black/80">—</p>
                    )}
                  </div>
                  <TextButton onClick={() => copyToClipboard(selectedContact.linkedInUrl, "linkedin")}>
                    {copiedField === "linkedin" ? "Copied" : "Copy"}
                  </TextButton>
                </div>
              </div>
            </section>

            <NotesIntelligenceSection
              context={{ brandId: selectedContact.brandId, contactId: selectedContact.id }}
              session={session}
              title="Notes & intelligence"
              subtitle="Private, lightweight memory — not tasks and not messages."
            />

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Outreach history</p>
                  <p className="mt-1 text-sm text-brand-black/60">Every touchpoint linked to this contact.</p>
                </div>
              </div>
              <div className="mt-4">
                <OutreachRecordsPanel
                  session={session}
                  mode="embedded"
                  filter={{ brandId: selectedContact.brandId, contactId: selectedContact.id }}
                  limit={8}
                  title="Outreach history"
                  subtitle=""
                />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Linked CRM objects</p>
                  <p className="mt-1 text-sm text-brand-black/60">Read-only placeholders. Links come later.</p>
                </div>
                <Pill tone="neutral">CRM-native</Pill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { label: "Deals", count: 0 },
                  { label: "Tasks", count: 0 },
                  { label: "Outreach", count: 0 },
                  { label: "Events", count: 0 }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-black">{item.label}</p>
                      <Pill tone="neutral">{item.count}</Pill>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70"
                        title="Coming soon"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70"
                        title="Coming soon"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </Drawer>

      <Drawer
        open={editorOpen}
        title={editorMode === "create" ? "Add brand" : "Edit brand"}
        onClose={() => setEditorOpen(false)}
        actions={
          <PrimaryButton
            onClick={() => {
              upsert();
            }}
          >
            Save
          </PrimaryButton>
        }
      >
        {/* Core Details Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Core details</p>
          <div className="space-y-4">
            <Field
              label="Brand name"
              value={editorDraft.brandName}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, brandName: v }))}
              placeholder="e.g. Atlantis The Royal"
            />
            <Field
              label="Website (optional)"
              value={editorDraft.website}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, website: v }))}
              onBlur={() => {
                const url = editorDraft.website.trim();
                if (url && !editorDraft.logo) {
                  enrichWebsite(url);
                }
              }}
              placeholder="https://…"
            />
            {enrichmentSuggestion && (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <BrandAvatar name={editorDraft.brandName || "Brand"} logo={enrichmentSuggestion.logo} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/70">Logo detected</p>
                    <p className="mt-1 text-xs text-brand-black/60">We found a logo for this website. Use it?</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={applyEnrichmentSuggestion}
                    className="rounded-full border border-brand-black/10 bg-brand-black px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-black/90"
                  >
                    Use this logo
                  </button>
                  <button
                    type="button"
                    onClick={dismissEnrichmentSuggestion}
                    className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            {enriching && (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3">
                <p className="text-xs text-brand-black/60">Looking for brand logo...</p>
              </div>
            )}
            <Field
              label="Logo URL (optional)"
              value={editorDraft.logo}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, logo: v }))}
              placeholder="https://… (direct image URL)"
            />
            <Select
              label="Industry"
              value={editorDraft.industry}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, industry: v }))}
              options={BRAND_INDUSTRIES}
            />
          </div>
        </div>

        {/* Status & Ownership Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Status & Ownership</p>
          <div className="space-y-4">
            <Select
              label="Status"
              value={editorDraft.status}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, status: v }))}
              options={BRAND_STATUSES}
            />
            <Field
              label="Owner"
              value={editorDraft.owner}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, owner: v }))}
              placeholder="Agent/admin name"
            />
          </div>
        </div>

        {/* Relationship & Lifecycle Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Relationship & Lifecycle</p>
          <div className="space-y-4">
            <Select
              label="Lifecycle stage (optional)"
              value={editorDraft.lifecycleStage}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, lifecycleStage: v }))}
              options={LIFECYCLE_STAGES}
            />
            <Select
              label="Relationship strength (optional)"
              value={editorDraft.relationshipStrength}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, relationshipStrength: v }))}
              options={RELATIONSHIP_STRENGTHS}
            />
            <Select
              label="Primary contact (optional)"
              value={editorDraft.primaryContactId}
              onChange={(v) => setEditorDraft((prev) => ({ ...prev, primaryContactId: v }))}
              options={[
                { value: "", label: "None" },
                ...(Array.isArray(brandContacts) ? brandContacts : []).map(c => ({ 
                  value: c.id, 
                  label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || "Unnamed" 
                }))
              ]}
            />
          </div>
        </div>

        {/* Internal Notes Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Internal Notes</p>
          <TextArea
            label="Internal notes"
            value={editorDraft.internalNotes}
            onChange={(v) => setEditorDraft((prev) => ({ ...prev, internalNotes: v }))}
            placeholder="Relationship context, preferences, constraints…"
          />
        </div>
      </Drawer>

      <Drawer
        open={contactEditorOpen}
        title={contactEditorMode === "create" ? "Add contact" : "Edit contact"}
        onClose={() => setContactEditorOpen(false)}
        actions={
          <PrimaryButton
            onClick={() => {
              upsertContact();
            }}
          >
            Save
          </PrimaryButton>
        }
      >
        {/* Core Details Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Core details</p>
          <div className="space-y-4">
            <Field
              label="First name"
              value={contactDraft.firstName}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, firstName: v }))}
              placeholder="e.g. Sarah"
            />
            <Field
              label="Last name"
              value={contactDraft.lastName}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, lastName: v }))}
              placeholder="e.g. Khan"
            />
            <Field
              label="Role / title (optional)"
              value={contactDraft.role}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, role: v }))}
              placeholder="e.g. Partnerships Lead"
            />
            <Select
              label="Relationship status"
              value={contactDraft.relationshipStatus}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, relationshipStatus: v }))}
              options={["New", "Warm", "Active", "Dormant"]}
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Contact Information</p>
          <div className="space-y-4">
            <Field
              label="Email (optional)"
              value={contactDraft.email}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, email: v }))}
              placeholder="name@brand.com"
            />
            <Field
              label="Phone (optional)"
              value={contactDraft.phone}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, phone: v }))}
              placeholder="+44…"
            />
            <Field
              label="LinkedIn URL (optional)"
              value={contactDraft.linkedInUrl}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, linkedInUrl: v }))}
              placeholder="https://linkedin.com/in/…"
            />
            <Select
              label="Preferred contact method"
              value={contactDraft.preferredContactMethod}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, preferredContactMethod: v }))}
              options={["", "Email", "WhatsApp", "Instagram", "Phone"]}
            />
          </div>
        </div>

        {/* Ownership & Settings Section */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Ownership & Settings</p>
          <div className="space-y-4">
            <Field
              label="Owner"
              value={contactDraft.owner}
              onChange={(v) => setContactDraft((prev) => ({ ...prev, owner: v }))}
              placeholder="Agent/admin name"
            />
            <div className="flex items-center gap-3 rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3">
              <input
                id="primaryContact"
                type="checkbox"
                checked={Boolean(contactDraft.primaryContact)}
                onChange={(e) => setContactDraft((prev) => ({ ...prev, primaryContact: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="primaryContact" className="text-sm text-brand-black/70">
                Mark as primary contact for this brand
              </label>
            </div>
          </div>
        </div>
      </Drawer>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBrandToDelete(null);
        }}
        onConfirm={handleDeleteBrand}
        brandName={brandToDelete?.brandName || ""}
        hasLinkedObjects={getLinkedObjectsSummary(brandToDelete).total > 0}
        linkedObjectsSummary={getLinkedObjectsSummary(brandToDelete)}
      />
    </DashboardShell>
  );
}

export default AdminBrandsPage;

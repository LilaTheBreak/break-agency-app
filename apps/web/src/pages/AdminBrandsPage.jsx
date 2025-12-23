import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { BrandChip } from "../components/BrandChip.jsx";
import { ContactChip } from "../components/ContactChip.jsx";
import { OutreachRecordsPanel } from "../components/OutreachRecordsPanel.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { formatCampaignDateRange, readCrmCampaigns } from "../lib/crmCampaigns.js";
import { EventChip } from "../components/EventChip.jsx";
import { formatEventDateTimeRange, readCrmEvents } from "../lib/crmEvents.js";
import { DealChip } from "../components/DealChip.jsx";
import { readCrmDeals } from "../lib/crmDeals.js";
import { ContractChip } from "../components/ContractChip.jsx";
import { computeExpiryRisk, formatContractEndDate, readCrmContracts } from "../lib/crmContracts.js";
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

function TextButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
    >
      {children}
    </button>
  );
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
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
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
        className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-brand-black/10 bg-brand-white shadow-[0_35px_120px_rgba(0,0,0,0.25)]"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b border-brand-black/5 bg-brand-white px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Brands</p>
              <h3 id="drawer-title" className="font-display text-2xl uppercase text-brand-black">{title}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
      <p className="font-display text-3xl uppercase text-brand-black">No brands yet</p>
      <p className="mt-3 text-sm text-brand-black/70">
        Add a brand to track deals, outreach, and campaigns — even if they never log in.
      </p>
      <div className="mt-6 flex justify-center">
        <PrimaryButton onClick={onAdd}>Add brand</PrimaryButton>
      </div>
    </div>
  );
}

function ActionsMenu({ onEdit, onOpen }) {
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
  const ownerDefault =
    session?.name?.split(" ")?.[0] || session?.email?.split("@")?.[0]?.split(".")?.[0] || "Admin";

  const [brands, setBrands] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState(() => readCrmCampaigns());
  const [events, setEvents] = useState(() => readCrmEvents());
  const [deals, setDeals] = useState(() => readCrmDeals());
  const [contracts, setContracts] = useState(() => readCrmContracts());
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

        console.log('[CRM] Initial brands loaded:', brandsResult.brands?.length || 0);
        console.log('[CRM] Initial contacts loaded:', contactsResult.contacts?.length || 0);
        setBrands(brandsResult.brands || []);
        setContacts(contactsResult.contacts || []);
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
      
      setBrands(brandsResult.brands || []);
      setContacts(contactsResult.contacts || []);
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
      
      console.log('[CRM] Fetched brands:', brandsResult.brands?.length || 0);
      console.log('[CRM] Fetched contacts:', contactsResult.contacts?.length || 0);
      setBrands(brandsResult.brands || []);
      setContacts(contactsResult.contacts || []);
    } catch (error) {
      console.error("[CRM] Unexpected error refreshing data:", error);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (brands || [])
      .filter((b) => (statusFilter === "All" ? true : b.status === statusFilter))
      .filter((b) => (q ? `${b.brandName} ${b.website} ${b.industry}`.toLowerCase().includes(q) : true))
      .sort((a, b) => (b.lastActivityAt || b.createdAt || "").localeCompare(a.lastActivityAt || a.createdAt || ""));
  }, [brands, query, statusFilter]);

  const selectedBrand = useMemo(() => brands.find((b) => b.id === drawerBrandId) || null, [brands, drawerBrandId]);
  const brandCampaigns = useMemo(() => {
    if (!selectedBrand) return [];
    return (campaigns || [])
      .filter((c) => c.brandId === selectedBrand.id)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [campaigns, selectedBrand]);
  const brandEvents = useMemo(() => {
    if (!selectedBrand) return [];
    return (events || [])
      .filter((e) => e.brandId === selectedBrand.id)
      .sort((a, b) => String(b.startDateTime || "").localeCompare(String(a.startDateTime || "")));
  }, [events, selectedBrand]);
  const brandDeals = useMemo(() => {
    if (!selectedBrand) return [];
    return (deals || [])
      .filter((d) => d.brandId === selectedBrand.id)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [deals, selectedBrand]);
  const brandContracts = useMemo(() => {
    if (!selectedBrand) return [];
    return (contracts || [])
      .filter((c) => c.brandId === selectedBrand.id)
      .sort((a, b) => String(b.lastUpdatedAt || b.createdAt || "").localeCompare(String(a.lastUpdatedAt || a.createdAt || "")));
  }, [contracts, selectedBrand]);
  const brandContacts = useMemo(() => {
    if (!selectedBrand) return [];
    return (contacts || [])
      .filter((c) => c.brandId === selectedBrand.id)
      .sort((a, b) => {
        if (Boolean(b.primaryContact) !== Boolean(a.primaryContact)) return b.primaryContact ? 1 : -1;
        return `${a.lastName || ""} ${a.firstName || ""}`.localeCompare(`${b.lastName || ""} ${b.firstName || ""}`);
      });
  }, [contacts, selectedBrand]);

  const [contactDrawerId, setContactDrawerId] = useState("");
  const selectedContact = useMemo(
    () => (contacts || []).find((c) => c.id === contactDrawerId) || null,
    [contacts, contactDrawerId]
  );

  useEffect(() => {
    if (!drawerBrandId) return;
    setCampaigns(readCrmCampaigns());
    setEvents(readCrmEvents());
    setDeals(readCrmDeals());
    setContracts(readCrmContracts());
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
      industry: "Other",
      status: "Prospect",
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
      industry: brand.industry || "Other",
      status: brand.status || "Prospect",
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
          industry: editorDraft.industry,
          status: editorDraft.status,
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
        industry: editorDraft.industry,
        status: editorDraft.status,
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
        const newContact = await createContact(contactData);
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

  return (
    <DashboardShell title="Brands" subtitle="Track brands as long-lived CRM entities — without login assumptions." role="admin" navLinks={ADMIN_NAV_LINKS}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Brands</p>
              <h2 className="font-display text-3xl uppercase text-brand-black">Brand CRM</h2>
              <p className="mt-1 text-sm text-brand-black/70">
                Store every brand you work with (or have worked with) and link them across deals, outreach, and finance.
              </p>
            </div>
            <PrimaryButton onClick={openCreate}>Add brand</PrimaryButton>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70">
              <span className="text-brand-black/60">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Brand name, website, industry…"
                className="w-56 bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none placeholder:text-brand-black/30"
              />
            </label>
            <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70">
              <span className="text-brand-black/60">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none"
              >
                {["All", ...BRAND_STATUSES].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <TextButton
              onClick={() => {
                setQuery("");
                setStatusFilter("All");
              }}
            >
              Reset
            </TextButton>
          </div>
        </section>

        {filtered.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <section className="space-y-3">
            {filtered.map((brand) => {
              const hints = deriveHint(brand);
              return (
                <article
                  key={brand.id}
                  className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_25px_80px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <BrandChip name={brand.brandName} status={brand.status} />
                        <Pill tone="neutral">{brand.industry || "Other"}</Pill>
                        <Pill tone={brand.status === "Active" ? "positive" : "neutral"}>{brand.status}</Pill>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-brand-black/70">
                        <span>Owner: <span className="font-semibold text-brand-black">{brand.owner || "—"}</span></span>
                        <span className="text-brand-black/30">•</span>
                        <span>Last activity: <span className="font-semibold text-brand-black">{shortActivity(brand.lastActivityLabel)}</span></span>
                        <span className="text-brand-black/30">•</span>
                        <span className="text-brand-black/60">{formatWhen(brand.lastActivityAt)}</span>
                      </div>
                      {brand.website ? (
                        <a
                          className="block truncate text-sm text-brand-black/60 underline underline-offset-4 hover:text-brand-black"
                          href={toExternalUrl(brand.website)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {brand.website}
                        </a>
                      ) : null}
                      {hints.length ? (
                        <div className="flex flex-wrap gap-2">
                          {hints.map((h) => (
                            <Pill key={h} tone="neutral">
                              {h}
                            </Pill>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <TextButton onClick={() => openDrawer(brand.id)}>Open</TextButton>
                      <ActionsMenu onOpen={() => openDrawer(brand.id)} onEdit={() => {
                        setDrawerBrandId(brand.id);
                        openEdit(brand);
                      }} />
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
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Owner</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selectedBrand.owner || "—"}</p>
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
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No campaigns yet. Group deals, talent, and events into campaigns to manage activations clearly.
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
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No deals yet. Deals are how revenue flows through the platform — every deal belongs to a brand.
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
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No contracts yet. Contracts link deals, brands, and talent — and power renewals and tasks later.
                  </p>
                  <p className="mt-2 text-xs text-brand-black/50">
                    Contracts require a linked deal; you can create a deal first, then attach the contract.
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
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No events yet. Add brand moments to keep prep, attendance, and follow-up calm and visible.
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
                {(selectedBrand.activity || []).slice(0, 12).map((entry) => (
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
                  <Pill tone="neutral">{brandContacts.length}</Pill>
                  <PrimaryButton onClick={() => openContactCreate(selectedBrand.id)}>Add contact</PrimaryButton>
                </div>
              </div>
              {brandContacts.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No contacts yet. Add marketing, partnerships, PR, founders, or assistants so outreach and deals stay contextual.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {brandContacts.map((contact) => (
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
              placeholder="https://…"
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
    </DashboardShell>
  );
}

export default AdminBrandsPage;

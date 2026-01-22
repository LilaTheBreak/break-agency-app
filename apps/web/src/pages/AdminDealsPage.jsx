import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { BrandChip } from "../components/BrandChip.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { DealChip } from "../components/DealChip.jsx";
import { EventChip } from "../components/EventChip.jsx";
import { ContractChip } from "../components/ContractChip.jsx";
import { NotesIntelligenceSection } from "../components/NotesIntelligenceSection.jsx";
import { DealSnapshotSummary } from "../components/DealSnapshotSummary.jsx";
import DealClassificationModal from "../components/DealClassificationModal.tsx";
import { BrandSelect } from "../components/BrandSelect.jsx";
import { useCrmBrands } from "../hooks/useCrmBrands.js";
import {
  DEAL_CONFIDENCE,
  DEAL_STATUSES,
  DEAL_TYPES,
  DEAL_VALUE_BANDS,
  isLostStatus,
  isWonStatus,
  validateDeal
} from "../lib/crmDeals.js";
import { formatEventDateTimeRange } from "../lib/crmEvents.js";
import { fetchDeals, createDeal, updateDeal, deleteDeal, fetchEvents, fetchCampaigns, fetchContracts, fetchBrands } from "../services/crmClient.js";
import { fetchTalents } from "../services/crmClient.js";
import { checkForLocalStorageData, migrateLocalStorageToDatabase, clearLocalStorageData } from "../lib/crmMigration.js";
import { computeExpiryRisk, formatContractEndDate } from "../lib/crmContracts.js";
import { normalizeApiArray } from "../lib/dataNormalization.js";

const BRANDS_STORAGE_KEY = "break_admin_brands_v1";

function safeRead(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70">
      {children}
    </span>
  );
}

function TextButton({ children, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Drawer({ open, title, subtitle, onClose, actions, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-brand-black/10 bg-brand-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{subtitle}</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <TextButton onClick={onClose}>Close</TextButton>
          </div>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
      </aside>
    </div>
  );
}

function ModalFrame({ open, title, subtitle, onClose, footer, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(820px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-black/10 bg-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{subtitle}</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">{title}</h3>
          </div>
          <TextButton onClick={onClose}>Close</TextButton>
        </div>
        <div className="mt-4 space-y-4">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required ? <span className="text-brand-red">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required, disabled }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required ? <span className="text-brand-red">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
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

function ActionsMenu({ onOpen, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Deal actions"
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-brand-black/10 bg-brand-white p-2 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpen();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left text-brand-red hover:bg-brand-red/10"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function buildDealHints(deal) {
  const hints = [];
  if ((deal.status === "In discussion" || deal.status === "Contract sent") && !deal.expectedCloseDate) {
    hints.push("Stalled");
  }
  if (deal.status === "In discussion" && deal.confidence === "Low") {
    hints.push("High activity, no close");
  }
  if (deal.status === "Prospect") {
    hints.push("Follow-up overdue");
  }
  if (isWonStatus(deal.status)) {
    hints.push("Similar deal closed before");
  }
  return hints.slice(0, 3);
}

export function AdminDealsPage({ session }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [events, setEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [talents, setTalents] = useState([]);
  const [drawerId, setDrawerId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrationData, setMigrationData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [classifyingDealId, setClassifyingDealId] = useState(null);

  // Use CRM brands hook - fetches from /api/crm-brands (the actual CRM brands table)
  const { brands, isLoading: brandsLoading, createBrand } = useCrmBrands();

  const brandById = useMemo(() => new Map((brands || []).map((b) => [b.id, b])), [brands]);
  const campaignById = useMemo(() => new Map((campaigns || []).map((c) => [c.id, c])), [campaigns]);

  // Load data from API
  const loadDeals = async () => {
    try {
      setLoading(true);
      // Don't load brands here - useBrands hook handles that
      const [dealsData, eventsData, campaignsData, contractsData, talentsData] = await Promise.all([
        fetchDeals(),
        fetchEvents(),
        fetchCampaigns(),
        fetchContracts(),
        fetchTalents().catch(() => []), // Load talents for deal creation (single source of truth)
      ]);
      // Use shared helper to normalize API responses
      setDeals(normalizeApiArray(dealsData, 'deals'));
      setEvents(normalizeApiArray(eventsData, 'events'));
      setCampaigns(normalizeApiArray(campaignsData, 'campaigns'));
      setContracts(normalizeApiArray(contractsData, 'contracts'));
      setTalents(Array.isArray(talentsData) ? talentsData : []);
      
      // Check for localStorage migration
      const migrationCheck = await checkForLocalStorageData();
      if (migrationCheck.hasData && migrationCheck.counts.deals > 0) {
        setMigrationData(migrationCheck);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      // Ensure arrays are set even on error
      setDeals([]);
      setEvents([]);
      setCampaigns([]);
      setContracts([]);
      setTalents([]);
    } finally {
      setLoading(false);
    }
  };

  // Listen for talent create/delete events to refetch talents
  useEffect(() => {
    const handleTalentChange = () => {
      // Refetch talents when talent is created or deleted
      fetchTalents()
        .then(data => setTalents(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Failed to refetch talents after change:", err);
        });
    };

    window.addEventListener('talent-created', handleTalentChange);
    window.addEventListener('talent-deleted', handleTalentChange);

    return () => {
      window.removeEventListener('talent-created', handleTalentChange);
      window.removeEventListener('talent-deleted', handleTalentChange);
    };
  }, []);

  useEffect(() => {
    loadDeals();
  }, []);

  const handleMigrate = async () => {
    if (!migrationData || isMigrating) return;
    setIsMigrating(true);
    try {
      await migrateLocalStorageToDatabase();
      await clearLocalStorageData();
      setMigrationData(null);
      await loadDeals();
    } catch (err) {
      console.error("Migration failed:", err);
      alert("Migration failed. Check console for details.");
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    const openId = searchParams.get("open");
    const create = searchParams.get("create");
    const brandId = searchParams.get("brandId");
    const campaignId = searchParams.get("campaignId");
    if (openId) setDrawerId(openId);
    if (create === "1") {
      setCreateOpen(true);
      setCreateForm((prev) => ({ ...prev, brandId: brandId || prev.brandId, campaignId: campaignId || prev.campaignId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!drawerId && !createOpen) return;
    // Refresh all data from API when drawer opens
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerId, createOpen]);

  const view = searchParams.get("view") || "active"; // active | wonlost
  const filterStatus = searchParams.get("status") || "";
  const filterBrandId = searchParams.get("brandId") || "";
  const filterOwner = searchParams.get("owner") || "";
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const visibleDeals = useMemo(() => {
    const list = (deals || [])
      .filter((d) => (view === "wonlost" ? true : !isLostStatus(d.status)))
      .filter((d) => (filterStatus ? d.status === filterStatus : true))
      .filter((d) => (filterBrandId ? d.brandId === filterBrandId : true))
      .filter((d) => (filterOwner ? (d.owner || "") === filterOwner : true))
      .filter((d) => {
        if (!q) return true;
        const brandName = d.brandId ? brandById.get(d.brandId)?.brandName || brandById.get(d.brandId)?.name || "" : "";
        return (
          (d.dealName || "").toLowerCase().includes(q) ||
          (d.dealType || "").toLowerCase().includes(q) ||
          brandName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return list;
  }, [deals, view, filterStatus, filterBrandId, filterOwner, q, brandById]);

  const selectedDeal = useMemo(() => deals.find((d) => d.id === drawerId) || null, [deals, drawerId]);
  const selectedDealBrand = selectedDeal?.brandId ? brandById.get(selectedDeal.brandId) : null;
  const selectedDealCampaign = selectedDeal?.campaignId ? campaignById.get(selectedDeal.campaignId) : null;
  const selectedDealEvents = useMemo(() => {
    if (!selectedDeal) return [];
    const dealId = selectedDeal.id;
    return (events || [])
      .filter((e) => e.dealId === dealId || (Array.isArray(e.linkedDealIds) && e.linkedDealIds.includes(dealId)))
      .sort((a, b) => String(a.startDateTime || "").localeCompare(String(b.startDateTime || "")));
  }, [events, selectedDeal]);
  const selectedDealContracts = useMemo(() => {
    if (!selectedDeal) return [];
    return (contracts || [])
      .filter((c) => c.dealId === selectedDeal.id)
      .sort((a, b) => String(b.lastUpdatedAt || b.createdAt || "").localeCompare(String(a.lastUpdatedAt || a.createdAt || "")));
  }, [contracts, selectedDeal]);

  const owners = useMemo(() => Array.from(new Set((deals || []).map((d) => d.owner).filter(Boolean))).sort(), [deals]);

  const [createForm, setCreateForm] = useState({
    dealName: "",
    brandId: "",
    dealType: DEAL_TYPES[0],
    status: "Prospect",
    estimatedValueBand: DEAL_VALUE_BANDS[0],
    confidence: "Medium",
    expectedCloseDate: "",
    deliveryDate: "",
    internalSummary: "",
    notes: "",
    campaignId: "",
    eventIds: [],
    talentIds: [], // Array for UI, but we'll use first one for backend
    owner: session?.name || session?.email?.split("@")[0] || "Admin"
  });

  const openDrawer = (id) => {
    setDrawerId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("open", id);
      return next;
    });
  };

  const closeDrawer = () => {
    setDrawerId("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("open");
      return next;
    });
  };

  const openCreate = (opts = {}) => {
    setCreateError("");
    setCreateForm((prev) => ({
      ...prev,
      dealName: "",
      internalSummary: "",
      notes: "",
      expectedCloseDate: "",
      deliveryDate: "",
      brandId: opts.brandId || prev.brandId || "",
      campaignId: opts.campaignId || prev.campaignId || "",
      owner: prev.owner || session?.name || session?.email?.split("@")[0] || "Admin"
    }));
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateError("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("create");
      next.delete("brandId");
      next.delete("campaignId");
      return next;
    });
  };

  const createNewDeal = async () => {
    // CRITICAL: Backend requires userId and talentId
    if (!session?.id) {
      setCreateError("User session not found. Please log in again.");
      return;
    }

    // Get talentId from talentIds array (first one, or empty if none selected)
    // Backend requires a single talentId (string), but UI uses array for future multi-talent support
    const talentId = Array.isArray(createForm.talentIds) && createForm.talentIds.length > 0
      ? createForm.talentIds[0]
      : "";

    if (!talentId) {
      setCreateError("Please select a talent for this deal.");
      return;
    }

    // CLEAN PAYLOAD: Only send backend-required fields, no UI theatre
    const dealPayload = {
      dealName: createForm.dealName.trim(),
      brandId: createForm.brandId,
      userId: session.id,
      talentId: talentId,
      status: createForm.status,
      estimatedValue: createForm.estimatedValueBand ? parseFloat(String(createForm.estimatedValueBand).replace(/[^\d.]/g, '')) || null : null,
      expectedCloseDate: createForm.expectedCloseDate || null,
      notes: createForm.notes || null,
    };

    try {
      const created = await createDeal(dealPayload);
      if (!created || !created.id) {
        throw new Error("Server returned no deal data");
      }
      toast.success("Deal created successfully");
      await loadDeals();
      setCreateOpen(false);
      openDrawer(created.id);
    } catch (err) {
      console.error("Failed to create deal:", err);
      setCreateError("Failed to create deal: " + (err.message || "Please check that brand and talent are selected."));
      toast.error("Failed to create deal: " + err.message);
    }
  };

  const handleUpdateDeal = async (patch) => {
    if (!selectedDeal) return;
    const next = { ...selectedDeal, ...patch, updatedAt: nowIso() };
    const verdict = validateDeal(next);
    if (!verdict.ok) return;
    try {
      await updateDeal(selectedDeal.id, patch);
      await loadDeals();
      
      // If status changed to won, prompt for classification
      if (patch.status && isWonStatus(patch.status) && !selectedDeal.revenueCoded) {
        setClassifyingDealId(selectedDeal.id);
        setClassificationModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to update deal:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update deal";
      toast.error(errorMessage);
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm("Delete this deal permanently?")) return;
    try {
      await deleteDeal(dealId);
      await loadDeals();
      if (drawerId === dealId) closeDrawer();
    } catch (err) {
      console.error("Failed to delete deal:", err);
      alert("Failed to delete deal");
    }
  };

  const dealIsValid = selectedDeal ? validateDeal(selectedDeal).ok : true;

  return (
    <DashboardShell
      title="Deals"
      subtitle="Deals are the commercial spine — every deal belongs to a brand, and work attaches to deals."
      navLinks={ADMIN_NAV_LINKS}
    >
      {migrationData && migrationData.deals > 0 && (
        <div className="mb-4 rounded-3xl border border-amber-500/30 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-900">Local storage migration available</p>
              <p className="mt-1 text-sm text-amber-800">
                Found {migrationData.deals} deal(s) in browser storage. Migrate to database?
              </p>
            </div>
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isMigrating ? "Migrating..." : "Migrate Now"}
            </button>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">CRM</p>
            <h2 className="font-display text-3xl uppercase text-brand-black">Deals</h2>
            <p className="mt-2 text-sm text-brand-black/60">
              Calm, serious, non-salesy pipeline. Value stays abstracted (bands), not numbers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextButton onClick={() => navigate("/admin/brands")}>Open brands</TextButton>
            <PrimaryButton onClick={() => openCreate()}>Create deal</PrimaryButton>
          </div>
        </div>

        {/* Snapshot summary: Pipeline, revenue, attention metrics */}
        <div className="mt-6">
          <DealSnapshotSummary />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("view", "active");
                  return next;
                })
              }
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border",
                view === "active" ? "bg-brand-red text-white border-brand-red" : "border-brand-black/20 text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Active deals
            </button>
            <button
              type="button"
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("view", "wonlost");
                  return next;
                })
              }
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border",
                view === "wonlost" ? "bg-brand-red text-white border-brand-red" : "border-brand-black/20 text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Won / lost
            </button>
            <Pill>{visibleDeals.length} shown</Pill>
          </div>

          <input
            type="search"
            value={searchParams.get("q") || ""}
            onChange={(e) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                const value = e.target.value;
                if (value) next.set("q", value);
                else next.delete("q");
                return next;
              })
            }
            placeholder="Search deals, brands, types…"
            className="w-full max-w-md rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Select
            label="By status"
            value={filterStatus}
            onChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set("status", v);
                else next.delete("status");
                return next;
              })
            }
            options={[{ value: "", label: "All statuses" }, ...DEAL_STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            label="By brand"
            value={filterBrandId}
            onChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set("brandId", v);
                else next.delete("brandId");
                return next;
              })
            }
            options={[
              { value: "", label: "All brands" },
              ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))
            ]}
          />
          <Select
            label="By owner"
            value={filterOwner}
            onChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set("owner", v);
                else next.delete("owner");
                return next;
              })
            }
            options={[{ value: "", label: "All owners" }, ...owners.map((o) => ({ value: o, label: o }))]}
          />
          <div className="flex items-end">
            <TextButton
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  ["status", "brandId", "owner", "q"].forEach((k) => next.delete(k));
                  return next;
                })
              }
            >
              Clear filters
            </TextButton>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="text-sm text-brand-black/70">Loading deals...</p>
          </div>
        ) : visibleDeals.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="font-display text-3xl uppercase text-brand-black">No deals yet</p>
            <p className="mt-3 text-sm text-brand-black/70">
              Deals are how revenue flows through the platform — every deal belongs to a brand.
            </p>
            <div className="mt-6 flex justify-center">
              <PrimaryButton onClick={() => openCreate()}>Create deal</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visibleDeals.map((deal) => {
              const brand = brandById.get(deal.brandId);
              const campaign = deal.campaignId ? campaignById.get(deal.campaignId) : null;
              const dealEventsCount = (events || []).filter(
                (e) => e.dealId === deal.id || (Array.isArray(e.linkedDealIds) && e.linkedDealIds.includes(deal.id))
              ).length;
              return (
                <article key={deal.id} className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <DealChip name={deal.dealName} status={deal.status} />
                        <Pill>{deal.status}</Pill>
                        <Pill>{deal.estimatedValueBand || "£"}</Pill>
                        <Pill>{deal.confidence || "Medium"}</Pill>
                        {deal.expectedCloseDate ? (
                          <span className="text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/50">
                            Expected close: {new Date(deal.expectedCloseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {brand ? (
                          <BrandChip
                            name={brand.brandName || brand.name}
                            status={brand.status || "Active"}
                            size="sm"
                          />
                        ) : (
                          <Pill>Brand missing (invalid)</Pill>
                        )}
                        {campaign ? <CampaignChip name={campaign.campaignName} status={campaign.status} size="sm" /> : null}
                        <Pill>Owner: {deal.owner || "—"}</Pill>
                      </div>
                      <p className="mt-3 text-sm text-brand-black/70">
                        {(deal.internalSummary || "").trim() ? deal.internalSummary.trim() : "Add a short, human-readable summary: what this deal is and what matters."}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/60">
                        <span>Tasks: <span className="font-semibold text-brand-black">{(deal.linkedTaskIds || []).length}</span></span>
                        <span className="text-brand-black/20">•</span>
                        <span>Events: <span className="font-semibold text-brand-black">{dealEventsCount}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TextButton onClick={() => openDrawer(deal.id)}>Open</TextButton>
                      <ActionsMenu onOpen={() => openDrawer(deal.id)} onDelete={() => handleDeleteDeal(deal.id)} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ModalFrame
        open={createOpen}
        title="Create deal"
        subtitle="Deals"
        onClose={closeCreate}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            {createError ? <p className="mr-auto text-sm text-brand-red">{createError}</p> : null}
            <TextButton onClick={closeCreate}>Cancel</TextButton>
            <PrimaryButton
              onClick={createNewDeal}
              disabled={!createForm.dealName.trim() || !createForm.brandId || !createForm.talentIds?.[0]}
            >
              Create deal
            </PrimaryButton>
          </div>
        }
      >
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-sm text-brand-black/80">
            A deal must belong to a brand. This is structurally required — no floating deals.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Deal name"
            required
            value={createForm.dealName}
            onChange={(v) => setCreateForm((p) => ({ ...p, dealName: v }))}
            placeholder="e.g. Maison Orion Spring Partnership"
          />
          <div>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Brand <span className="text-brand-red">*</span></span>
              <div className="mt-2">
                <BrandSelect
                  brands={brands}
                  value={createForm.brandId}
                  onChange={(v) => setCreateForm((p) => ({ ...p, brandId: v }))}
                  isLoading={brandsLoading}
                  onCreateBrand={createBrand}
                />
              </div>
            </label>
          </div>
          <Select
            label="Deal type"
            value={createForm.dealType}
            onChange={(v) => setCreateForm((p) => ({ ...p, dealType: v }))}
            options={DEAL_TYPES}
          />
          <Select
            label="Status"
            value={createForm.status}
            onChange={(v) => setCreateForm((p) => ({ ...p, status: v }))}
            options={DEAL_STATUSES}
          />
          <Select
            label="Value band"
            value={createForm.estimatedValueBand}
            onChange={(v) => setCreateForm((p) => ({ ...p, estimatedValueBand: v }))}
            options={DEAL_VALUE_BANDS}
          />
          <Select
            label="Confidence"
            value={createForm.confidence}
            onChange={(v) => setCreateForm((p) => ({ ...p, confidence: v }))}
            options={DEAL_CONFIDENCE}
          />
          <Field
            label="Expected close (optional)"
            type="date"
            value={createForm.expectedCloseDate || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, expectedCloseDate: v }))}
          />
          <Field
            label="Delivery date (optional)"
            type="date"
            value={createForm.deliveryDate || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, deliveryDate: v }))}
          />
          <Select
            label="Campaign (optional)"
            value={createForm.campaignId || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, campaignId: v }))}
            options={[
              { value: "", label: "None" },
              ...campaigns.map((c) => ({ value: c.id, label: c.campaignName }))
            ]}
          />
          <Select
            label="Talent"
            required
            value={createForm.talentIds?.[0] || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, talentIds: v ? [v] : [] }))}
            options={[
              { value: "", label: "Select a talent…" },
              ...talents.map((t) => ({ 
                value: t.id, 
                label: t.name || t.User?.email || t.id 
              }))
            ]}
          />
          <Field
            label="Owner"
            value={createForm.owner}
            onChange={(v) => setCreateForm((p) => ({ ...p, owner: v }))}
            placeholder="Agent / admin"
          />
        </div>
        <TextArea
          label="Internal summary"
          value={createForm.internalSummary}
          onChange={(v) => setCreateForm((p) => ({ ...p, internalSummary: v }))}
          placeholder="Short, human-readable context."
          rows={3}
        />
        <TextArea
          label="Notes (internal only)"
          value={createForm.notes}
          onChange={(v) => setCreateForm((p) => ({ ...p, notes: v }))}
          placeholder="Expectations, sensitivities, constraints."
          rows={4}
        />
      </ModalFrame>

      <Drawer
        open={Boolean(selectedDeal)}
        title={selectedDeal?.dealName || "Deal"}
        subtitle="Deals"
        onClose={closeDrawer}
        actions={
          selectedDeal ? (
            <div className="flex gap-2">
              <TextButton
                onClick={() => {
                  setClassifyingDealId(selectedDeal.id);
                  setClassificationModalOpen(true);
                }}
              >
                Classify
              </TextButton>
              <TextButton
                onClick={async () => {
                  const duplicated = {
                    ...selectedDeal,
                    id: `deal-${Date.now()}`,
                    dealName: `${selectedDeal.dealName} (copy)`,
                    createdAt: nowIso(),
                    updatedAt: nowIso(),
                    lastActivityAt: nowIso(),
                    linkedTaskIds: [],
                    linkedOutreachIds: [],
                    activity: [{ at: nowIso(), label: "Deal created" }]
                  };
                  const verdict = validateDeal(duplicated);
                  if (!verdict.ok) return;
                  try {
                    const created = await createDeal(duplicated);
                    await loadDeals();
                    openDrawer(created.id);
                  } catch (err) {
                    console.error("Failed to duplicate deal:", err);
                    alert("Failed to duplicate deal");
                  }
                  openDrawer(duplicated.id);
                }}
              >
                Duplicate
              </TextButton>
            </div>
          ) : null
        }
      >
        {selectedDeal ? (
          <>
            {!dealIsValid ? (
              <div className="rounded-2xl border border-brand-red/30 bg-brand-red/10 p-4">
                <p className="text-sm text-brand-red">
                  This deal is invalid. Deals must belong to a brand.
                </p>
              </div>
            ) : null}

            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DealChip name={selectedDeal.dealName} status={selectedDeal.status} />
                  <Pill>{selectedDeal.status}</Pill>
                  <Pill>{selectedDeal.dealType}</Pill>
                  <Pill>{selectedDeal.estimatedValueBand || "£"}</Pill>
                  <Pill>Confidence: {selectedDeal.confidence || "Medium"}</Pill>
                </div>
                <Pill>Owner: {selectedDeal.owner || "—"}</Pill>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field
                  label="Deal name"
                  required
                  value={selectedDeal.dealName || ""}
                  onChange={(v) => handleUpdateDeal({ dealName: v })}
                  placeholder="Deal name"
                />
                <div>
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Brand <span className="text-brand-red">*</span></span>
                    <div className="mt-2">
                      <BrandSelect
                        brands={brands}
                        value={selectedDeal.brandId || ""}
                        onChange={(v) => handleUpdateDeal({ brandId: v })}
                        isLoading={brandsLoading}
                        onCreateBrand={createBrand}
                      />
                    </div>
                  </label>
                </div>
                <Select
                  label="Status"
                  value={selectedDeal.status}
                  onChange={(v) => handleUpdateDeal({ status: v })}
                  options={DEAL_STATUSES}
                />
                <Select
                  label="Deal type"
                  value={selectedDeal.dealType}
                  onChange={(v) => handleUpdateDeal({ dealType: v })}
                  options={DEAL_TYPES}
                />
                <Select
                  label="Value band"
                  value={selectedDeal.estimatedValueBand || DEAL_VALUE_BANDS[0]}
                  onChange={(v) => handleUpdateDeal({ estimatedValueBand: v })}
                  options={DEAL_VALUE_BANDS}
                />
                <Select
                  label="Confidence"
                  value={selectedDeal.confidence || "Medium"}
                  onChange={(v) => handleUpdateDeal({ confidence: v })}
                  options={DEAL_CONFIDENCE}
                />
                <Field
                  label="Expected close"
                  type="date"
                  value={selectedDeal.expectedCloseDate || ""}
                  onChange={(v) => handleUpdateDeal({ expectedCloseDate: v || null })}
                />
                <Field
                  label="Delivery date"
                  type="date"
                  value={selectedDeal.deliveryDate || ""}
                  onChange={(v) => handleUpdateDeal({ deliveryDate: v || null })}
                />
                <Select
                  label="Campaign"
                  value={selectedDeal.campaignId || ""}
                  onChange={(v) => handleUpdateDeal({ campaignId: v || null })}
                  options={[
                    { value: "", label: "None" },
                    ...campaigns.map((c) => ({ value: c.id, label: c.campaignName }))
                  ]}
                />
                <Field
                  label="Owner"
                  value={selectedDeal.owner || ""}
                  onChange={(v) => handleUpdateDeal({ owner: v })}
                  placeholder="Agent / admin"
                />
              </div>

              <div className="mt-4 grid gap-3">
                <TextArea
                  label="Internal summary"
                  value={selectedDeal.internalSummary || ""}
                  onChange={(v) => handleUpdateDeal({ internalSummary: v })}
                  placeholder="Short, human-readable context."
                  rows={3}
                />
                <TextArea
                  label="Notes (internal only)"
                  value={selectedDeal.notes || ""}
                  onChange={(v) => handleUpdateDeal({ notes: v })}
                  placeholder="Expectations, sensitivities, constraints."
                  rows={4}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedDealBrand ? (
                  <BrandChip
                    name={selectedDealBrand.brandName || selectedDealBrand.name}
                    status={selectedDealBrand.status || "Active"}
                    size="sm"
                  />
                ) : (
                  <Pill>Brand required</Pill>
                )}
                {selectedDealCampaign ? (
                  <CampaignChip name={selectedDealCampaign.campaignName} status={selectedDealCampaign.status} size="sm" />
                ) : null}
              </div>
            </section>

            <NotesIntelligenceSection
              context={{ brandId: selectedDeal.brandId, dealId: selectedDeal.id }}
              session={session}
              title="Notes & intelligence"
              subtitle="Private margin notes — nuance and learnings that shouldn’t be lost."
            />

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Talent</p>
                  <p className="mt-1 text-sm text-brand-black/60">Design-only chips. Required for creator deals later.</p>
                </div>
                <TextButton disabled title="Coming soon">Add talent</TextButton>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/60">No talent linked yet.</p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Tasks</p>
                  <p className="mt-1 text-sm text-brand-black/60">All work should attach to a deal when commercial.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TextButton disabled title="Coming soon">Add task</TextButton>
                  <TextButton disabled title="Coming soon">Add task bundle</TextButton>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/60">No tasks linked yet.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/60">
                  <span>Pending: <span className="font-semibold text-brand-black">0</span></span>
                  <span className="text-brand-black/20">•</span>
                  <span>In progress: <span className="font-semibold text-brand-black">0</span></span>
                  <span className="text-brand-black/20">•</span>
                  <span>Complete: <span className="font-semibold text-brand-black">0</span></span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Events</p>
                  <p className="mt-1 text-sm text-brand-black/60">Appearances, launches, trips. Time-bound context.</p>
                </div>
                <TextButton onClick={() => navigate(`/admin/events?create=1&dealId=${encodeURIComponent(selectedDeal.id)}`)}>
                  Create event
                </TextButton>
              </div>
              {selectedDealEvents.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/60">No events linked yet.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {selectedDealEvents.slice(0, 8).map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <EventChip name={event.eventName} status={event.status} size="sm" />
                          <Pill>{event.eventType}</Pill>
                          {event.startDateTime ? (
                            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
                              {formatEventDateTimeRange({ startDateTime: event.startDateTime, endDateTime: event.endDateTime })}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TextButton onClick={() => navigate(`/admin/events?open=${encodeURIComponent(event.id)}`)}>
                          Open
                        </TextButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Documents / contracts</p>
                  <p className="mt-1 text-sm text-brand-black/60">Context first: status, dates, renewal risk.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TextButton
                    onClick={() =>
                      navigate(
                        `/admin/documents?create=1&brandId=${encodeURIComponent(selectedDeal.brandId || "")}&dealId=${encodeURIComponent(
                          selectedDeal.id
                        )}`
                      )
                    }
                  >
                    Add contract
                  </TextButton>
                  <TextButton onClick={() => navigate(`/admin/documents?dealId=${encodeURIComponent(selectedDeal.id)}`)}>
                    View all
                  </TextButton>
                </div>
              </div>
              {selectedDealContracts.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No contracts yet. Contracts are commercial objects — not just files — and will drive renewals and tasks later.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {selectedDealContracts.slice(0, 6).map((contract) => {
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
                            <Pill>{contract.contractType}</Pill>
                            <Pill>{contract.status}</Pill>
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
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Outreach</p>
                  <p className="mt-1 text-sm text-brand-black/60">Touchpoints tied to this deal (design-only for now).</p>
                </div>
                <TextButton disabled title="Coming soon">Log outreach</TextButton>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/60">No outreach linked yet.</p>
                <p className="mt-2 text-xs text-brand-black/50">Future: outreach records can reference `dealId` and roll up here.</p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Finance</p>
                  <p className="mt-1 text-sm text-brand-black/60">Placeholder: invoice status without amounts (value band only).</p>
                </div>
                <Pill>Not invoiced</Pill>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/70">
                  Invoicing will appear here later. No revenue reporting or payment tracking in this phase.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Calm hints</p>
                  <p className="mt-1 text-sm text-brand-black/60">Dismissible signals that feed tasks later.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {buildDealHints(selectedDeal).map((hint) => (
                  <div key={hint} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3">
                    <p className="text-sm text-brand-black/70">{hint}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Danger zone</p>
                  <p className="mt-1 text-sm text-brand-black/60">Permanently delete this deal.</p>
                </div>
                <TextButton onClick={() => handleDeleteDeal(selectedDeal.id)}>Delete deal</TextButton>
              </div>
            </section>
          </>
        ) : null}
      </Drawer>

      {classificationModalOpen && classifyingDealId && (
        <DealClassificationModal
          dealId={classifyingDealId}
          deal={selectedDeal}
          isOpen={classificationModalOpen}
          onClose={() => {
            setClassificationModalOpen(false);
            setClassifyingDealId(null);
          }}
          onClassified={async (classification) => {
            await loadDeals();
            setClassificationModalOpen(false);
            setClassifyingDealId(null);
          }}
        />
      )}
    </DashboardShell>
  );
}

export default AdminDealsPage;

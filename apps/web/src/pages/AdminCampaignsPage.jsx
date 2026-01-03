import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { BrandChip } from "../components/BrandChip.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { EventChip } from "../components/EventChip.jsx";
import { DealChip } from "../components/DealChip.jsx";
import { ContractChip } from "../components/ContractChip.jsx";
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES, formatCampaignDateRange } from "../lib/crmCampaigns.js";
import { formatEventDateTimeRange } from "../lib/crmEvents.js";
import { computeExpiryRisk, formatContractEndDate } from "../lib/crmContracts.js";
import {
  fetchBrands,
  fetchCampaigns,
  fetchEvents,
  fetchDeals,
  fetchContracts,
  createCampaign as createCampaignAPI,
  updateCampaign as updateCampaignAPI,
  deleteCampaign as deleteCampaignAPI,
  linkDealToCampaign,
  unlinkDealFromCampaign,
} from "../services/crmClient.js";
import { checkForLocalStorageData, migrateLocalStorageToDatabase } from "../lib/crmMigration.js";
import { normalizeApiArray } from "../lib/dataNormalization.js";

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

function Drawer({ open, title, onClose, subtitle, actions, children }) {
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
      <div className="absolute left-1/2 top-1/2 w-[min(720px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-black/10 bg-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
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

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required ? <span className="text-brand-red">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required ? <span className="text-brand-red">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
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

function CampaignActionsMenu({ onOpen, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Campaign actions"
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

function buildCalmHints(campaign) {
  const hints = [];
  if (campaign.status === "Active" && (campaign.linkedDealIds || []).length >= 2) hints.push("Multiple touchpoints active");
  if (campaign.status === "Active" && !campaign.endDate) hints.push("Time box not set yet");
  if (campaign.status === "Draft" && (campaign.internalSummary || "").length > 0) hints.push("Ready to activate");
  if (campaign.status === "Completed") hints.push("Repeat campaign with this brand");
  return hints.slice(0, 3);
}

export function AdminCampaignsPage({ session }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [events, setEvents] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerId, setDrawerId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dismissedHints, setDismissedHints] = useState({});
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const migration = await checkForLocalStorageData();
        if (migration.hasData && migration.counts.campaigns > 0) {
          setMigrationNeeded(true);
        }
        
        const [campaignsData, brandsData, eventsData, dealsData, contractsData] = await Promise.all([
          fetchCampaigns(),
          fetchBrands(),
          fetchEvents(),
          fetchDeals(),
          fetchContracts(),
        ]);
        // Use shared helper to normalize API responses
        setCampaigns(normalizeApiArray(campaignsData, 'campaigns'));
        setBrands(normalizeApiArray(brandsData, 'brands'));
        setEvents(normalizeApiArray(eventsData, 'events'));
        setDeals(normalizeApiArray(dealsData, 'deals'));
        setContracts(normalizeApiArray(contractsData, 'contracts'));
      } catch (error) {
        console.error("Failed to load data:", error);
        // Ensure arrays are set even on error
        setCampaigns([]);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const refreshData = async () => {
    try {
      const [campaignsData, eventsData, dealsData, contractsData] = await Promise.all([
        fetchCampaigns(),
        fetchEvents(),
        fetchDeals(),
        fetchContracts(),
      ]);
      // Use shared helper to normalize API responses (consistent with loadData)
      setCampaigns(normalizeApiArray(campaignsData, 'campaigns'));
      setEvents(normalizeApiArray(eventsData, 'events'));
      setDeals(normalizeApiArray(dealsData, 'deals'));
      setContracts(normalizeApiArray(contractsData, 'contracts'));
    } catch (error) {
      console.error("Failed to refresh data:", error);
      // Ensure all are arrays on error
      setCampaigns([]);
      setEvents([]);
      setDeals([]);
      setContracts([]);
    }
  };

  const handleMigration = async () => {
    if (!confirm("Migrate your localStorage campaigns to the database?")) return;
    try {
      setLoading(true);
      await migrateLocalStorageToDatabase();
      await refreshData();
      setMigrationNeeded(false);
      alert("Migration complete! Your campaigns are now in the database.");
    } catch (error) {
      console.error("Migration failed:", error);
      alert("Migration failed. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const brandById = useMemo(() => {
    const map = new Map();
    // Defensive: Ensure brands is an array before iterating
    if (Array.isArray(brands)) {
      brands.forEach((b) => map.set(b.id, b));
    }
    return map;
  }, [brands]);

  useEffect(() => {
    const openId = searchParams.get("open");
    const create = searchParams.get("create");
    const brandId = searchParams.get("brandId");
    if (openId) setDrawerId(openId);
    if (create === "1") {
      setCreateOpen(true);
      setCreateForm((prev) => ({ ...prev, brandId: brandId || prev.brandId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [createForm, setCreateForm] = useState({
    campaignName: "",
    brandId: "",
    campaignType: CAMPAIGN_TYPES[0],
    status: "Draft",
    startDate: "",
    endDate: "",
    internalSummary: "",
    goals: "",
    keyNotes: "",
    owner: session?.name || session?.email?.split("@")[0] || "Admin"
  });

  const visibleCampaigns = useMemo(() => {
    const needle = (searchParams.get("q") || "").trim().toLowerCase();
    // Defensive: Ensure campaigns is an array
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
    const list = [...safeCampaigns].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    if (!needle) return list;
    return list.filter((campaign) => {
      const brandName = brandById.get(campaign.brandId)?.brandName || "";
      return (
        (campaign.campaignName || "").toLowerCase().includes(needle) ||
        brandName.toLowerCase().includes(needle) ||
        (campaign.campaignType || "").toLowerCase().includes(needle)
      );
    });
  }, [campaigns, searchParams, brandById]);

  const selectedCampaign = useMemo(() => {
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
    return safeCampaigns.find((c) => c.id === drawerId) || null;
  }, [campaigns, drawerId]);
  const campaignDeals = useMemo(() => {
    if (!selectedCampaign) return [];
    return (deals || [])
      .filter((d) => d.campaignId === selectedCampaign.id)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [deals, selectedCampaign]);
  const campaignContracts = useMemo(() => {
    if (!selectedCampaign) return [];
    return (contracts || [])
      .filter((c) => c.campaignId === selectedCampaign.id)
      .sort((a, b) => String(b.lastUpdatedAt || b.createdAt || "").localeCompare(String(a.lastUpdatedAt || a.createdAt || "")));
  }, [contracts, selectedCampaign]);
  const campaignEvents = useMemo(() => {
    if (!selectedCampaign) return [];
    return (events || [])
      .filter((e) => e.campaignId === selectedCampaign.id)
      .sort((a, b) => String(b.startDateTime || "").localeCompare(String(a.startDateTime || "")));
  }, [events, selectedCampaign]);

  useEffect(() => {
    if (!drawerId) return;
    // Refresh related data from API
    refreshData();
  }, [drawerId]);

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
    setCreateForm((prev) => ({
      ...prev,
      campaignName: "",
      internalSummary: "",
      goals: "",
      keyNotes: "",
      brandId: opts.brandId || prev.brandId || "",
      owner: prev.owner || session?.name || session?.email?.split("@")[0] || "Admin"
    }));
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("create");
      next.delete("brandId");
      return next;
    });
  };

  const createCampaign = async () => {
    const name = createForm.campaignName.trim();
    if (!name) return;
    if (!createForm.brandId) return;
    
    try {
      setLoading(true);
      const campaignData = {
        campaignName: name,
        brandId: createForm.brandId,
        campaignType: createForm.campaignType,
        status: createForm.status,
        startDate: createForm.startDate || null,
        endDate: createForm.endDate || null,
        internalSummary: createForm.internalSummary || null,
        goals: createForm.goals || null,
        keyNotes: createForm.keyNotes || null,
        owner: createForm.owner || "Admin",
      };
      
      const newCampaign = await createCampaignAPI(campaignData);
      await refreshData();
      setCreateOpen(false);
      openDrawer(newCampaign.id);
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (patch) => {
    if (!selectedCampaign) return;
    
    try {
      setLoading(true);
      await updateCampaignAPI(selectedCampaign.id, patch);
      await refreshData();
    } catch (error) {
      console.error("Failed to update campaign:", error);
      alert("Failed to update campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!confirm("Delete this campaign? This will permanently remove it from the database.")) return;
    
    try {
      setLoading(false);
      await deleteCampaignAPI(campaignId);
      await refreshData();
      if (drawerId === campaignId) closeDrawer();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      alert("Failed to delete campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchValue = searchParams.get("q") || "";

  return (
    <DashboardShell
      title="Campaigns"
      subtitle="Group deals, talent, and events into time-bound activations — without overloading deals."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">CRM</p>
            <h2 className="font-display text-3xl uppercase text-brand-black">Campaigns / activations</h2>
            <p className="mt-2 text-sm text-brand-black/60">
              Calm, outcome-aware moments. No pressure dashboards.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextButton onClick={() => navigate("/admin/brands")}>Open brands</TextButton>
            <PrimaryButton onClick={() => openCreate()}>Create campaign</PrimaryButton>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={searchValue}
            onChange={(e) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                const value = e.target.value;
                if (value) next.set("q", value);
                else next.delete("q");
                return next;
              })
            }
            placeholder="Search campaigns, brands, types…"
            className="w-full max-w-md rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
            {visibleCampaigns.length} total
          </p>
        </div>

        {visibleCampaigns.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="font-display text-3xl uppercase text-brand-black">No campaigns yet</p>
            <p className="mt-3 text-sm text-brand-black/70">
              Group deals, talent, and events into campaigns to manage activations clearly.
            </p>
            <div className="mt-6 flex justify-center">
              <PrimaryButton onClick={() => openCreate()}>Create campaign</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visibleCampaigns.map((campaign) => {
              const brand = brandById.get(campaign.brandId);
              const counts = {
                deals: (campaign.linkedDealIds || []).length,
                talent: (campaign.linkedTalentIds || []).length,
                tasks: (campaign.linkedTaskIds || []).length
              };
              return (
                <article
                  key={campaign.id}
                  className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CampaignChip name={campaign.campaignName} status={campaign.status} />
                        {brand ? <BrandChip name={brand.brandName} status={brand.status || "Active"} size="sm" /> : <Pill>Brand missing</Pill>}
                        <Pill>{campaign.campaignType}</Pill>
                        <Pill>{campaign.status}</Pill>
                        {campaign.startDate || campaign.endDate ? (
                          <span className="text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/50">
                            {formatCampaignDateRange({ startDate: campaign.startDate, endDate: campaign.endDate })}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-brand-black/70">
                        {(campaign.internalSummary || "").trim()
                          ? campaign.internalSummary.trim()
                          : "A calm internal summary helps everyone move in sync."}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/60">
                        <span>Deals: <span className="font-semibold text-brand-black">{counts.deals}</span></span>
                        <span className="text-brand-black/20">•</span>
                        <span>Talent: <span className="font-semibold text-brand-black">{counts.talent}</span></span>
                        <span className="text-brand-black/20">•</span>
                        <span>Tasks: <span className="font-semibold text-brand-black">{counts.tasks}</span></span>
                        <span className="text-brand-black/20">•</span>
                        <span>Owner: <span className="font-semibold text-brand-black">{campaign.owner || "—"}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TextButton onClick={() => openDrawer(campaign.id)}>Open</TextButton>
                      <CampaignActionsMenu onOpen={() => openDrawer(campaign.id)} onDelete={() => deleteCampaign(campaign.id)} />
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
        title="Create campaign"
        subtitle="Campaigns / activations"
        onClose={closeCreate}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <TextButton onClick={closeCreate}>Cancel</TextButton>
            <PrimaryButton onClick={createCampaign} disabled={!createForm.campaignName.trim() || !createForm.brandId}>
              Create campaign
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Campaign name"
            required
            value={createForm.campaignName}
            onChange={(v) => setCreateForm((p) => ({ ...p, campaignName: v }))}
            placeholder="e.g. Maison Orion Winter Residency"
          />
          <Select
            label="Brand"
            required
            value={createForm.brandId}
            onChange={(v) => setCreateForm((p) => ({ ...p, brandId: v }))}
            options={[
              { value: "", label: "Select a brand…" },
              ...brands.map((b) => ({ value: b.id, label: b.brandName }))
            ]}
          />
          <Select
            label="Campaign type"
            value={createForm.campaignType}
            onChange={(v) => setCreateForm((p) => ({ ...p, campaignType: v }))}
            options={CAMPAIGN_TYPES}
          />
          <Select
            label="Status"
            value={createForm.status}
            onChange={(v) => setCreateForm((p) => ({ ...p, status: v }))}
            options={CAMPAIGN_STATUSES}
          />
          <label className="block">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Start date</span>
            <input
              type="date"
              value={createForm.startDate || ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">End date (optional)</span>
            <input
              type="date"
              value={createForm.endDate || ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
            />
          </label>
        </div>
        <TextArea
          label="Internal summary"
          value={createForm.internalSummary}
          onChange={(v) => setCreateForm((p) => ({ ...p, internalSummary: v }))}
          placeholder="Short description (internal)."
          rows={3}
        />
        <TextArea
          label="Goals"
          value={createForm.goals}
          onChange={(v) => setCreateForm((p) => ({ ...p, goals: v }))}
          placeholder="Drive awareness, launch product, build long-term partnership…"
          rows={3}
        />
        <TextArea
          label="Key notes (internal only)"
          value={createForm.keyNotes}
          onChange={(v) => setCreateForm((p) => ({ ...p, keyNotes: v }))}
          placeholder="Any calm internal context, constraints, sensitivities."
          rows={4}
        />
        <Field
          label="Owner"
          value={createForm.owner}
          onChange={(v) => setCreateForm((p) => ({ ...p, owner: v }))}
          placeholder="Agent / admin"
        />
      </ModalFrame>

      <Drawer
        open={Boolean(selectedCampaign)}
        title={selectedCampaign?.campaignName || "Campaign"}
        subtitle="Campaigns / activations"
        onClose={closeDrawer}
        actions={
          selectedCampaign ? (
            <TextButton
              onClick={async () => {
                try {
                  const duplicated = await createCampaignAPI({
                    ...selectedCampaign,
                    id: undefined, // Let API generate new ID
                    campaignName: `${selectedCampaign.campaignName} (Copy)`,
                  });
                  await refreshData();
                  openDrawer(duplicated.id);
                } catch (error) {
                  console.error("Failed to duplicate campaign:", error);
                  alert("Failed to duplicate campaign. Please try again.");
                }
              }}
            >
              Duplicate
            </TextButton>
          ) : null
        }
      >
        {selectedCampaign ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CampaignChip name={selectedCampaign.campaignName} status={selectedCampaign.status} />
                  <Pill>{selectedCampaign.status}</Pill>
                  <Pill>{selectedCampaign.campaignType}</Pill>
                  {selectedCampaign.startDate || selectedCampaign.endDate ? (
                    <Pill>{formatCampaignDateRange({ startDate: selectedCampaign.startDate, endDate: selectedCampaign.endDate })}</Pill>
                  ) : null}
                </div>
                <Pill>Owner: {selectedCampaign.owner || "—"}</Pill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Select
                  label="Status"
                  value={selectedCampaign.status}
                  onChange={(v) => updateCampaign({ status: v })}
                  options={CAMPAIGN_STATUSES}
                />
                <Select
                  label="Campaign type"
                  value={selectedCampaign.campaignType}
                  onChange={(v) => updateCampaign({ campaignType: v })}
                  options={CAMPAIGN_TYPES}
                />
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Start date</span>
                  <input
                    type="date"
                    value={selectedCampaign.startDate || ""}
                    onChange={(e) => updateCampaign({ startDate: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">End date</span>
                  <input
                    type="date"
                    value={selectedCampaign.endDate || ""}
                    onChange={(e) => updateCampaign({ endDate: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
                  />
                </label>
                <Select
                  label="Brand"
                  value={selectedCampaign.brandId}
                  onChange={(v) => updateCampaign({ brandId: v })}
                  options={[
                    ...brands.map((b) => ({ value: b.id, label: b.brandName }))
                  ]}
                />
                <Field
                  label="Owner"
                  value={selectedCampaign.owner || ""}
                  onChange={(v) => updateCampaign({ owner: v })}
                  placeholder="Agent / admin"
                />
              </div>
              <div className="mt-4 grid gap-3">
                <TextArea
                  label="Internal summary"
                  value={selectedCampaign.internalSummary || ""}
                  onChange={(v) => updateCampaign({ internalSummary: v })}
                  placeholder="Short description (internal)."
                  rows={3}
                />
                <TextArea
                  label="Goals"
                  value={selectedCampaign.goals || ""}
                  onChange={(v) => updateCampaign({ goals: v })}
                  placeholder="Drive awareness, launch product, build long-term partnership…"
                  rows={3}
                />
                <TextArea
                  label="Key notes (internal only)"
                  value={selectedCampaign.keyNotes || ""}
                  onChange={(v) => updateCampaign({ keyNotes: v })}
                  placeholder="Anything the team should know, without pressure."
                  rows={4}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Timeline</p>
                  <p className="mt-1 text-sm text-brand-black/60">Lightweight moments — not a project plan.</p>
                </div>
                <TextButton disabled title="Coming soon">Add key moment</TextButton>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Range</p>
                    <p className="mt-1 text-sm text-brand-black/80">
                      {formatCampaignDateRange({ startDate: selectedCampaign.startDate, endDate: selectedCampaign.endDate }) || "No dates set yet"}
                    </p>
                  </div>
                  <Pill>{selectedCampaign.status}</Pill>
                </div>
                <div className="mt-4 h-1 w-full rounded-full bg-brand-black/10">
                  <div className="h-1 w-1/3 rounded-full bg-brand-red/40" />
                </div>
                <p className="mt-3 text-xs text-brand-black/60">
                  Key moments (event date, content drop, deadline) will appear here later.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Linked entities</p>
                  <p className="mt-1 text-sm text-brand-black/60">Read-only lists for now. “Add” is a placeholder.</p>
                </div>
                <Pill>CRM-native</Pill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { label: "Deals", count: campaignDeals.length },
                  { label: "Talent", count: (selectedCampaign.linkedTalentIds || []).length },
                  { label: "Tasks", count: (selectedCampaign.linkedTaskIds || []).length },
                  { label: "Outreach", count: (selectedCampaign.linkedOutreachIds || []).length },
                  { label: "Events", count: campaignEvents.length }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-black">{item.label}</p>
                      <Pill>{item.count}</Pill>
                    </div>
                    <p className="mt-2 text-xs text-brand-black/60">Latest activity: {selectedCampaign.activity?.[0]?.label || "—"}</p>
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
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Task bundles</p>
                    <p className="mt-1 text-sm text-brand-black/60">Quick-start templates. UI only for now.</p>
                  </div>
                  <TextButton disabled title="Coming soon">Add bundle</TextButton>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {["Campaign kickoff", "Talent onboarding", "Content delivery"].map((bundle) => (
                    <div key={bundle} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3">
                      <p className="text-sm font-semibold text-brand-black">{bundle}</p>
                      <p className="mt-1 text-xs text-brand-black/60">Adds a calm task set and links them here.</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Deals</p>
                  <p className="mt-1 text-sm text-brand-black/60">Commercial opportunities grouped by this campaign.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>{campaignDeals.length}</Pill>
                  <TextButton
                    onClick={() =>
                      navigate(
                        `/admin/deals?create=1&campaignId=${encodeURIComponent(selectedCampaign.id)}&brandId=${encodeURIComponent(
                          selectedCampaign.brandId || ""
                        )}`
                      )
                    }
                  >
                    Create deal
                  </TextButton>
                </div>
              </div>
              {campaignDeals.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No deals linked to this campaign yet. Deals can exist with or without a campaign.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {campaignDeals.slice(0, 6).map((deal) => (
                    <div
                      key={deal.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <DealChip name={deal.dealName} status={deal.status} size="sm" />
                          <Pill>{deal.estimatedValueBand || "£"}</Pill>
                          <Pill>{deal.status}</Pill>
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
                  {campaignDeals.length > 6 ? (
                    <div className="pt-2">
                      <TextButton onClick={() => navigate(`/admin/deals?campaignId=${encodeURIComponent(selectedCampaign.id)}`)}>
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
                  <p className="mt-1 text-sm text-brand-black/60">Context-rich contracts linked to this campaign (optional).</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>{campaignContracts.length}</Pill>
                  <TextButton
                    onClick={() =>
                      navigate(
                        `/admin/documents?create=1&campaignId=${encodeURIComponent(selectedCampaign.id)}&brandId=${encodeURIComponent(
                          selectedCampaign.brandId || ""
                        )}`
                      )
                    }
                  >
                    Add contract
                  </TextButton>
                </div>
              </div>
              {campaignContracts.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No contracts linked to this campaign yet. Contracts are primarily anchored to deals, with optional campaign context.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {campaignContracts.slice(0, 6).map((contract) => {
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
                  {campaignContracts.length > 6 ? (
                    <div className="pt-2">
                      <TextButton onClick={() => navigate(`/admin/documents?campaignId=${encodeURIComponent(selectedCampaign.id)}`)}>
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
                  <p className="mt-1 text-sm text-brand-black/60">Brand moments and touchpoints inside this campaign.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>{campaignEvents.length}</Pill>
                  <TextButton
                    onClick={() =>
                      navigate(
                        `/admin/events?create=1&campaignId=${encodeURIComponent(selectedCampaign.id)}&brandId=${encodeURIComponent(
                          selectedCampaign.brandId || ""
                        )}`
                      )
                    }
                  >
                    Create event
                  </TextButton>
                </div>
              </div>
              {campaignEvents.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No events yet. Add dinners, trips, panels, or previews so prep + follow-up stay in context.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {campaignEvents.slice(0, 6).map((event) => (
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
                  {campaignEvents.length > 6 ? (
                    <div className="pt-2">
                      <TextButton
                        onClick={() => navigate(`/admin/events?campaignId=${encodeURIComponent(selectedCampaign.id)}&view=upcoming`)}
                      >
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
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Activity feed</p>
                  <p className="mt-1 text-sm text-brand-black/60">Chronological, readable, not noisy.</p>
                </div>
                <TextButton
                  onClick={() => {
                    const next = {
                      ...dismissedHints,
                      [selectedCampaign.id]: true
                    };
                    setDismissedHints(next);
                  }}
                  disabled={Boolean(dismissedHints[selectedCampaign.id])}
                >
                  Dismiss hints
                </TextButton>
              </div>

              {!dismissedHints[selectedCampaign.id] ? (
                <div className="mt-4 grid gap-2">
                  {buildCalmHints(selectedCampaign).map((hint) => (
                    <div key={hint} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3">
                      <p className="text-sm text-brand-black/70">{hint}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                {(selectedCampaign.activity || []).slice(0, 14).map((entry) => (
                  <div key={`${entry.at}-${entry.label}`} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
                    <p className="text-sm text-brand-black/80">{entry.label}</p>
                    <p className="mt-1 text-xs text-brand-black/60">
                      {new Date(entry.at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Danger zone</p>
                  <p className="mt-1 text-sm text-brand-black/60">Campaigns are local-only for now.</p>
                </div>
                <TextButton
                  onClick={async () => {
                    if (!confirm(`Delete campaign "${selectedCampaign.campaignName}"? This cannot be undone.`)) return;
                    try {
                      await deleteCampaignAPI(selectedCampaign.id);
                      await refreshData();
                      closeDrawer();
                    } catch (error) {
                      console.error("Failed to delete campaign:", error);
                      alert("Failed to delete campaign. Please try again.");
                    }
                  }}
                >
                  Delete campaign
                </TextButton>
              </div>
              <p className="mt-3 text-xs text-brand-black/50">
                Campaigns are persisted in the database. Changes are saved automatically.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TextButton
                  onClick={async () => {
                    try {
                      const duplicated = await createCampaignAPI({
                        ...selectedCampaign,
                        id: undefined, // Let API generate new ID
                        campaignName: `${selectedCampaign.campaignName} (Copy)`,
                      });
                      await refreshData();
                      setDrawerId(duplicated.id);
                    } catch (error) {
                      console.error("Failed to duplicate campaign:", error);
                      alert("Failed to duplicate campaign. Please try again.");
                    }
                  }}
                >
                  Duplicate
                </TextButton>
              </div>
            </section>
          </>
        ) : null}
      </Drawer>
    </DashboardShell>
  );
}

export default AdminCampaignsPage;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { BrandChip } from "../components/BrandChip.jsx";
import { DealChip } from "../components/DealChip.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { EventChip } from "../components/EventChip.jsx";
import { ContractChip } from "../components/ContractChip.jsx";
import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  RENEWAL_TYPES,
  computeExpiryRisk,
  formatContractEndDate,
  isActiveContract,
  validateContract
} from "../lib/crmContracts.js";
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
  fetchDeals,
  fetchCampaigns,
  fetchEvents,
} from "../services/crmClient.js";
import { checkForLocalStorageData } from "../lib/crmMigration.js";

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

function Pill({ tone = "neutral", children }) {
  const toneClass =
    tone === "danger"
      ? "border-brand-red/30 bg-brand-red/10 text-brand-red"
      : "border-brand-black/10 bg-brand-white text-brand-black/70";
  return (
    <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${toneClass}`}>
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
      <div className="absolute left-1/2 top-1/2 w-[min(860px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
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
        aria-label="Contract actions"
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

function buildContractHints(contract) {
  const hints = [];
  const risk = computeExpiryRisk({ endDate: contract.endDate, status: contract.status });
  if (contract.status === "Sent") hints.push("Signature overdue (status: Sent)");
  if (risk === "High") hints.push(`Renewal approaching (end date: ${formatContractEndDate(contract.endDate)})`);
  if (contract.status === "Signed") hints.push("Contract similar to previous (placeholder)");
  if (risk === "High" || risk === "Medium") hints.push(`Expiry risk: ${risk} (based on end date)`);
  return Array.from(new Set(hints)).slice(0, 4);
}

export function AdminDocumentsPage({ session }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contracts, setContracts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrationAvailable, setMigrationAvailable] = useState(false);

  const [drawerId, setDrawerId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [dismissedHints, setDismissedHints] = useState({});

  // Load contracts and related data
  useEffect(() => {
    loadData();
    checkMigration();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [contractsRes, dealsRes, campaignsRes, eventsRes] = await Promise.all([
        fetchContracts(),
        fetchDeals(),
        fetchCampaigns(),
        fetchEvents(),
      ]);
      
      setContracts(contractsRes.contracts || []);
      setDeals(dealsRes.deals || []);
      setCampaigns(campaignsRes.campaigns || []);
      setEvents(eventsRes.events || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkMigration() {
    try {
      const result = await checkForLocalStorageData();
      setMigrationAvailable(result.hasData && result.counts.contracts > 0);
    } catch (error) {
      console.error("Error checking migration:", error);
    }
  }

  const brands = useMemo(() => safeRead(BRANDS_STORAGE_KEY, []), []);
  const brandById = useMemo(() => new Map((brands || []).map((b) => [b.id, b])), [brands]);
  const dealById = useMemo(() => new Map((deals || []).map((d) => [d.id, d])), [deals]);
  const campaignById = useMemo(() => new Map((campaigns || []).map((c) => [c.id, c])), [campaigns]);
  const eventById = useMemo(() => new Map((events || []).map((e) => [e.id, e])), [events]);

  useEffect(() => {
    const openId = searchParams.get("open");
    const create = searchParams.get("create");
    const brandId = searchParams.get("brandId");
    const dealId = searchParams.get("dealId");
    const campaignId = searchParams.get("campaignId");
    const eventId = searchParams.get("eventId");
    if (openId) setDrawerId(openId);
    if (create === "1") {
      setCreateOpen(true);
      setCreateForm((prev) => ({
        ...prev,
        brandId: brandId || prev.brandId,
        dealId: dealId || prev.dealId,
        campaignId: campaignId || prev.campaignId,
        eventId: eventId || prev.eventId
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const owners = useMemo(() => {
    return Array.from(new Set((contracts || []).map((c) => c.internalOwner).filter(Boolean))).sort();
  }, [contracts]);

  const view = searchParams.get("view") || "active"; // active | expiring
  const filterBrandId = searchParams.get("brandId") || "";
  const filterDealId = searchParams.get("dealId") || "";
  const filterStatus = searchParams.get("status") || "";
  const filterOwner = searchParams.get("owner") || "";
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const visibleContracts = useMemo(() => {
    const list = (contracts || [])
      .filter((c) => {
        if (view === "active") return isActiveContract(c.status);
        if (view === "expiring") return computeExpiryRisk({ endDate: c.endDate, status: c.status }) === "High";
        return true;
      })
      .filter((c) => (filterBrandId ? c.brandId === filterBrandId : true))
      .filter((c) => (filterDealId ? c.dealId === filterDealId : true))
      .filter((c) => (filterStatus ? c.status === filterStatus : true))
      .filter((c) => (filterOwner ? (c.internalOwner || "") === filterOwner : true))
      .filter((c) => {
        if (!q) return true;
        const brandName = c.brandId ? brandById.get(c.brandId)?.brandName || brandById.get(c.brandId)?.name || "" : "";
        const dealName = c.dealId ? dealById.get(c.dealId)?.dealName || "" : "";
        return (
          (c.contractName || "").toLowerCase().includes(q) ||
          (c.contractType || "").toLowerCase().includes(q) ||
          brandName.toLowerCase().includes(q) ||
          dealName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => String(b.lastUpdatedAt || b.createdAt || "").localeCompare(String(a.lastUpdatedAt || a.createdAt || "")));
    return list;
  }, [contracts, view, filterBrandId, filterDealId, filterStatus, filterOwner, q, brandById, dealById]);

  const selectedContract = useMemo(() => contracts.find((c) => c.id === drawerId) || null, [contracts, drawerId]);

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

  const [createForm, setCreateForm] = useState({
    contractName: "",
    contractType: CONTRACT_TYPES[0],
    status: "Draft",
    brandId: "",
    dealId: "",
    talentIds: [],
    internalOwner: session?.name || session?.email?.split("@")[0] || "Admin",
    startDate: "",
    endDate: "",
    renewalType: RENEWAL_TYPES[0],
    campaignId: "",
    eventId: "",
    notes: ""
  });

  const brandOptions = useMemo(() => {
    return [{ value: "", label: "Select a brand…" }, ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))];
  }, [brands]);

  const visibleDealsForCreate = useMemo(() => {
    const list = createForm.brandId ? (deals || []).filter((d) => d.brandId === createForm.brandId) : deals || [];
    return [{ value: "", label: createForm.brandId ? "Select a deal…" : "Select a brand first…" }].concat(
      list.map((d) => ({ value: d.id, label: d.dealName }))
    );
  }, [deals, createForm.brandId]);

  const campaignOptions = useMemo(() => [{ value: "", label: "None" }, ...(campaigns || []).map((c) => ({ value: c.id, label: c.campaignName }))], [campaigns]);
  const eventOptions = useMemo(() => [{ value: "", label: "None" }, ...(events || []).map((e) => ({ value: e.id, label: e.eventName }))], [events]);

  const openCreate = (opts = {}) => {
    setCreateError("");
    setCreateForm((prev) => ({
      ...prev,
      contractName: "",
      notes: "",
      brandId: opts.brandId || prev.brandId || "",
      dealId: opts.dealId || prev.dealId || "",
      campaignId: opts.campaignId || prev.campaignId || "",
      eventId: opts.eventId || prev.eventId || "",
      internalOwner: prev.internalOwner || session?.name || session?.email?.split("@")[0] || "Admin"
    }));
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateError("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ["create", "brandId", "dealId", "campaignId", "eventId"].forEach((k) => next.delete(k));
      return next;
    });
  };

  const createNewContract = async () => {
    const contractData = {
      contractName: createForm.contractName.trim(),
      contractType: createForm.contractType,
      status: createForm.status,
      brandId: createForm.brandId,
      dealId: createForm.dealId || null,
      talentIds: createForm.talentIds || [],
      internalOwner: createForm.internalOwner || "Admin",
      startDate: createForm.startDate || null,
      endDate: createForm.endDate || null,
      renewalType: createForm.renewalType,
      campaignId: createForm.campaignId || null,
      eventId: createForm.eventId || null,
      notes: createForm.notes || "",
    };

    const verdict = validateContract(contractData);
    if (!verdict.ok) {
      setCreateError(verdict.errors.join(" "));
      return;
    }

    try {
      const response = await createContract(contractData);
      if (response.contract) {
        await loadData();
        setCreateOpen(false);
        openDrawer(response.contract.id);
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      setCreateError("Failed to create contract. Please try again.");
    }
  };

  const handleUpdateContract = async (patch) => {
    if (!selectedContract) return;
    
    try {
      const response = await updateContract(selectedContract.id, patch);
      if (response.contract) {
        await loadData();
      }
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  const handleDeleteContract = async (id) => {
    if (!confirm("Delete this contract? This cannot be undone.")) return;
    
    try {
      await deleteContract(id);
      await loadData();
      if (drawerId === id) closeDrawer();
    } catch (error) {
      console.error("Error deleting contract:", error);
    }
  };

  if (loading) {
    return (
      <DashboardShell
        title="Documents / Contracts"
        subtitle="Loading..."
        navLinks={ADMIN_NAV_LINKS}
      >
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
          <p className="text-sm text-brand-black/70">Loading contracts...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Documents / Contracts"
      subtitle="Contracts are commercial objects with context — not just files."
      navLinks={ADMIN_NAV_LINKS}
    >
      {migrationAvailable && (
        <div className="mb-4 rounded-3xl border border-brand-red/30 bg-brand-red/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-brand-black">Local data detected</p>
              <p className="mt-1 text-sm text-brand-black/70">
                You have contracts saved in browser storage. Visit the CRM page to migrate them to the database.
              </p>
            </div>
            <TextButton onClick={() => navigate("/admin/crm")}>Migrate now</TextButton>
          </div>
        </div>
      )}
      
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">CRM</p>
            <h2 className="font-display text-3xl uppercase text-brand-black">Documents / contracts</h2>
            <p className="mt-2 text-sm text-brand-black/60">
              Dates, status, and context first. Files follow later.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextButton onClick={() => navigate("/admin/deals")}>Open deals</TextButton>
            <PrimaryButton onClick={() => openCreate()}>Add contract</PrimaryButton>
          </div>
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
              Active
            </button>
            <button
              type="button"
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("view", "expiring");
                  return next;
                })
              }
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border",
                view === "expiring" ? "bg-brand-red text-white border-brand-red" : "border-brand-black/20 text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Expiring soon
            </button>
            <Pill>{visibleContracts.length} shown</Pill>
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
            placeholder="Search contracts, brands, deals…"
            className="w-full max-w-md rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
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
            options={[{ value: "", label: "All brands" }, ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))]}
          />
          <Select
            label="By deal"
            value={filterDealId}
            onChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set("dealId", v);
                else next.delete("dealId");
                return next;
              })
            }
            options={[{ value: "", label: "All deals" }, ...(deals || []).map((d) => ({ value: d.id, label: d.dealName }))]}
          />
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
            options={[{ value: "", label: "All statuses" }, ...CONTRACT_STATUSES.map((s) => ({ value: s, label: s }))]}
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
        </div>

        {visibleContracts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="font-display text-3xl uppercase text-brand-black">No contracts yet</p>
            <p className="mt-3 text-sm text-brand-black/70">
              Contracts link deals, brands, and talent — and power renewals and tasks later.
            </p>
            <div className="mt-6 flex justify-center">
              <PrimaryButton onClick={() => openCreate()}>Add contract</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visibleContracts.map((contract) => {
              const brand = brandById.get(contract.brandId);
              const deal = dealById.get(contract.dealId);
              const risk = computeExpiryRisk({ endDate: contract.endDate, status: contract.status });
              const riskTone = risk === "High" ? "danger" : "neutral";
              return (
                <article key={contract.id} className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ContractChip name={contract.contractName} status={contract.status} />
                        <Pill>{contract.contractType}</Pill>
                        <Pill>{contract.status}</Pill>
                        <Pill tone={riskTone}>{risk} risk</Pill>
                        {contract.endDate ? (
                          <span className="text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/50">
                            Ends: {formatContractEndDate(contract.endDate)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {brand ? <BrandChip name={brand.brandName || brand.name} status={brand.status || "Active"} size="sm" /> : null}
                        {deal ? <DealChip name={deal.dealName} status={deal.status} size="sm" /> : null}
                        <Pill>Owner: {contract.internalOwner || "—"}</Pill>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TextButton onClick={() => openDrawer(contract.id)}>Open</TextButton>
                      <ActionsMenu onOpen={() => openDrawer(contract.id)} onDelete={() => removeContract(contract.id)} />
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
        title="Add contract"
        subtitle="Documents / contracts"
        onClose={closeCreate}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            {createError ? <p className="mr-auto text-sm text-brand-red">{createError}</p> : null}
            <TextButton onClick={closeCreate}>Cancel</TextButton>
            <PrimaryButton onClick={createNewContract} disabled={!createForm.contractName.trim() || !createForm.brandId}>
              Add contract
            </PrimaryButton>
          </div>
        }
      >
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-sm text-brand-black/80">
            Contracts are commercial objects with context. Brand + deal are required so nothing floats.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Contract name"
            required
            value={createForm.contractName}
            onChange={(v) => setCreateForm((p) => ({ ...p, contractName: v }))}
            placeholder="e.g. Maison Orion Brand Partnership Agreement"
          />
          <Select
            label="Type"
            value={createForm.contractType}
            onChange={(v) => setCreateForm((p) => ({ ...p, contractType: v }))}
            options={CONTRACT_TYPES}
          />
          <Select
            label="Status"
            value={createForm.status}
            onChange={(v) => setCreateForm((p) => ({ ...p, status: v }))}
            options={CONTRACT_STATUSES}
          />
          <Field
            label="Internal owner"
            value={createForm.internalOwner}
            onChange={(v) => setCreateForm((p) => ({ ...p, internalOwner: v }))}
            placeholder="Agent / admin"
          />
          <Select
            label="Brand"
            required
            value={createForm.brandId}
            onChange={(v) =>
              setCreateForm((p) => ({
                ...p,
                brandId: v,
                dealId: ""
              }))
            }
            options={brandOptions}
          />
          <Select
            label="Linked deal"
            required
            value={createForm.dealId}
            onChange={(v) => setCreateForm((p) => ({ ...p, dealId: v }))}
            options={visibleDealsForCreate}
            disabled={!createForm.brandId}
          />
          <Field
            label="Start date (optional)"
            type="date"
            value={createForm.startDate || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, startDate: v }))}
          />
          <Field
            label="End date (optional)"
            type="date"
            value={createForm.endDate || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, endDate: v }))}
          />
          <Select
            label="Renewal type"
            value={createForm.renewalType}
            onChange={(v) => setCreateForm((p) => ({ ...p, renewalType: v }))}
            options={RENEWAL_TYPES}
          />
          <Select
            label="Campaign (optional)"
            value={createForm.campaignId || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, campaignId: v }))}
            options={campaignOptions}
          />
          <Select
            label="Event (optional)"
            value={createForm.eventId || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, eventId: v }))}
            options={eventOptions}
          />
        </div>
        <TextArea
          label="Notes"
          value={createForm.notes}
          onChange={(v) => setCreateForm((p) => ({ ...p, notes: v }))}
          placeholder="Internal legal / commercial context (non-legalistic)."
          rows={4}
        />
      </ModalFrame>

      <Drawer
        open={Boolean(selectedContract)}
        title={selectedContract?.contractName || "Contract"}
        subtitle="Documents / contracts"
        onClose={closeDrawer}
        actions={
          selectedContract ? (
            <TextButton
              onClick={async () => {
                const duplicateData = {
                  contractName: `${selectedContract.contractName} (copy)`,
                  contractType: selectedContract.contractType,
                  status: selectedContract.status,
                  brandId: selectedContract.brandId,
                  dealId: selectedContract.dealId,
                  talentIds: selectedContract.talentIds || [],
                  internalOwner: selectedContract.internalOwner,
                  startDate: selectedContract.startDate,
                  endDate: selectedContract.endDate,
                  renewalType: selectedContract.renewalType,
                  campaignId: selectedContract.campaignId,
                  eventId: selectedContract.eventId,
                  notes: selectedContract.notes || "",
                };
                
                try {
                  const response = await createContract(duplicateData);
                  if (response.contract) {
                    await loadData();
                    openDrawer(response.contract.id);
                  }
                } catch (error) {
                  console.error("Error duplicating contract:", error);
                }
              }}
            >
              Duplicate
            </TextButton>
          ) : null
        }
      >
        {selectedContract ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ContractChip name={selectedContract.contractName} status={selectedContract.status} />
                  <Pill>{selectedContract.contractType}</Pill>
                  <Pill>{selectedContract.status}</Pill>
                  <Pill tone={computeExpiryRisk({ endDate: selectedContract.endDate, status: selectedContract.status }) === "High" ? "danger" : "neutral"}>
                    {computeExpiryRisk({ endDate: selectedContract.endDate, status: selectedContract.status })} risk
                  </Pill>
                </div>
                <Pill>Owner: {selectedContract.internalOwner || "—"}</Pill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field
                  label="Contract name"
                  required
                  value={selectedContract.contractName || ""}
                  onChange={(v) => handleUpdateContract({ contractName: v })}
                  placeholder="Contract name"
                />
                <Select
                  label="Type"
                  value={selectedContract.contractType}
                  onChange={(v) => handleUpdateContract({ contractType: v })}
                  options={CONTRACT_TYPES}
                />
                <Select
                  label="Status"
                  value={selectedContract.status}
                  onChange={(v) => handleUpdateContract({ status: v })}
                  options={CONTRACT_STATUSES}
                />
                <Field
                  label="Internal owner"
                  value={selectedContract.internalOwner || ""}
                  onChange={(v) => handleUpdateContract({ internalOwner: v })}
                  placeholder="Agent / admin"
                />
                <Select
                  label="Brand"
                  required
                  value={selectedContract.brandId || ""}
                  onChange={(v) => handleUpdateContract({ brandId: v })}
                  options={[{ value: "", label: "Select a brand…" }, ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))]}
                />
                <Select
                  label="Linked deal"
                  required
                  value={selectedContract.dealId || ""}
                  onChange={(v) => handleUpdateContract({ dealId: v })}
                  options={[
                    { value: "", label: "Select a deal…" },
                    ...(deals || []).filter((d) => d.brandId === selectedContract.brandId).map((d) => ({ value: d.id, label: d.dealName }))
                  ]}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedContract.brandId && brandById.get(selectedContract.brandId) ? (
                  <BrandChip
                    name={brandById.get(selectedContract.brandId).brandName || brandById.get(selectedContract.brandId).name}
                    status={brandById.get(selectedContract.brandId).status || "Active"}
                    size="sm"
                  />
                ) : null}
                {selectedContract.dealId && dealById.get(selectedContract.dealId) ? (
                  <DealChip name={dealById.get(selectedContract.dealId).dealName} status={dealById.get(selectedContract.dealId).status} size="sm" />
                ) : null}
                {selectedContract.campaignId && campaignById.get(selectedContract.campaignId) ? (
                  <CampaignChip name={campaignById.get(selectedContract.campaignId).campaignName} status={campaignById.get(selectedContract.campaignId).status} size="sm" />
                ) : null}
                {selectedContract.eventId && eventById.get(selectedContract.eventId) ? (
                  <EventChip name={eventById.get(selectedContract.eventId).eventName} status={eventById.get(selectedContract.eventId).status} size="sm" />
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Dates & terms</p>
                  <p className="mt-1 text-sm text-brand-black/60">Emphasise timing and renewal, not legal text.</p>
                </div>
                <Pill>
                  Ends: {formatContractEndDate(selectedContract.endDate)}
                </Pill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field
                  label="Start date"
                  type="date"
                  value={selectedContract.startDate || ""}
                  onChange={(v) => handleUpdateContract({ startDate: v || null })}
                />
                <Field
                  label="End date"
                  type="date"
                  value={selectedContract.endDate || ""}
                  onChange={(v) => handleUpdateContract({ endDate: v || null })}
                />
                <Select
                  label="Renewal type"
                  value={selectedContract.renewalType || RENEWAL_TYPES[0]}
                  onChange={(v) => handleUpdateContract({ renewalType: v })}
                  options={RENEWAL_TYPES}
                />
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Expiry risk</p>
                  <p className="mt-2 text-sm text-brand-black/80">
                    {computeExpiryRisk({ endDate: selectedContract.endDate, status: selectedContract.status })}
                  </p>
                  <p className="mt-1 text-xs text-brand-black/60">Display-only for now (based on end date).</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Files</p>
                  <p className="mt-1 text-sm text-brand-black/60">Versions list only. Upload is a placeholder.</p>
                </div>
                <TextButton disabled title="Coming soon">Upload new version</TextButton>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/70">No files yet.</p>
                <p className="mt-2 text-xs text-brand-black/50">
                  Future: attach PDFs/DOCs, keep versions, and prepare for AI reading.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Tasks</p>
                  <p className="mt-1 text-sm text-brand-black/60">Contracts should generate calm follow-through.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TextButton disabled title="Coming soon">Add task</TextButton>
                  <TextButton disabled title="Coming soon">Add task bundle</TextButton>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/70">No tasks linked yet.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {["Send contract", "Chase signature", "Deliverables due", "Renewal follow-up"].map((bundle) => (
                    <div key={bundle} className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-3">
                      <p className="text-sm font-semibold text-brand-black">{bundle}</p>
                      <p className="mt-1 text-xs text-brand-black/60">Creates tasks linked to this contract (future).</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Notes</p>
                  <p className="mt-1 text-sm text-brand-black/60">Internal legal/commercial context without jargon.</p>
                </div>
              </div>
              <div className="mt-4">
                <TextArea
                  label="Internal notes"
                  value={selectedContract.notes || ""}
                  onChange={(v) => handleUpdateContract({ notes: v })}
                  placeholder="Context, risks, sensitivities."
                  rows={5}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Calm hints</p>
                  <p className="mt-1 text-sm text-brand-black/60">Dismissible. Cites dates/status. Feeds tasks later.</p>
                </div>
                <TextButton
                  onClick={() => setDismissedHints((prev) => ({ ...prev, [selectedContract.id]: true }))}
                  disabled={Boolean(dismissedHints[selectedContract.id])}
                >
                  Dismiss hints
                </TextButton>
              </div>
              {!dismissedHints[selectedContract.id] ? (
                <div className="mt-4 grid gap-2">
                  {buildContractHints(selectedContract).map((hint) => (
                    <div key={hint} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3">
                      <p className="text-sm text-brand-black/70">{hint}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Danger zone</p>
                  <p className="mt-1 text-sm text-brand-black/60">Delete this contract permanently.</p>
                </div>
                <TextButton onClick={() => handleDeleteContract(selectedContract.id)}>Delete contract</TextButton>
              </div>
              <p className="mt-3 text-xs text-brand-black/50">
                This action cannot be undone. All contract data will be permanently removed.
              </p>
            </section>
          </>
        ) : null}
      </Drawer>
    </DashboardShell>
  );
}

export default AdminDocumentsPage;


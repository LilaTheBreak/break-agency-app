import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { BrandChip } from "../components/BrandChip.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import { EventChip } from "../components/EventChip.jsx";
import { DealChip } from "../components/DealChip.jsx";
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  formatEventDateTimeRange,
  isPastEvent,
  isUpcomingEvent
} from "../lib/crmEvents.js";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "../services/crmClient.js";
import { checkForLocalStorageData, migrateLocalStorageToDatabase, clearLocalStorageData } from "../lib/crmMigration.js";
import { readCrmDeals } from "../lib/crmDeals.js";

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
      className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="absolute left-1/2 top-1/2 w-[min(760px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
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

function ActionsMenu({ onOpen, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Event actions"
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

function eventTypeIcon(type) {
  const map = {
    "Brand event": "🍷",
    "Press event": "📰",
    "Creator trip": "✈️",
    "Panel / speaking": "🎤",
    Workshop: "🛠️",
    Internal: "🗓️",
    Other: "•"
  };
  return map[type] || "•";
}

function buildHints(event) {
  const hints = [];
  if ((event.status === "Planned" || event.status === "Confirmed") && (event.linkedTaskIds || []).length === 0) {
    hints.push("Prep incomplete");
  }
  if ((event.attendeeTalentIds || []).length >= 3) hints.push("High-profile attendees");
  if (event.status === "Completed" && (event.linkedOutreachIds || []).length === 0) hints.push("Follow-up pending");
  if (event.brandId && event.status === "Completed") hints.push("Repeat event with this brand");
  return hints.slice(0, 3);
}

export function AdminEventsPage({ session }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [deals, setDeals] = useState(() => readCrmDeals());
  const [drawerId, setDrawerId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [migrationData, setMigrationData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Load brands from localStorage (they're still there for now)
  useEffect(() => {
    const loadedBrands = safeRead(BRANDS_STORAGE_KEY, []);
    setBrands(loadedBrands);
  }, []);

  const brandById = useMemo(() => new Map((brands || []).map((b) => [b.id, b])), [brands]);
  const campaignById = useMemo(() => new Map((campaigns || []).map((c) => [c.id, c])), [campaigns]);
  const dealById = useMemo(() => new Map((deals || []).map((d) => [d.id, d])), [deals]);
  const dealOptions = useMemo(() => {
    return (deals || []).map((deal) => {
      const brandName = deal.brandId ? brandById.get(deal.brandId)?.brandName || brandById.get(deal.brandId)?.name || "" : "";
      return { value: deal.id, label: brandName ? `${deal.dealName} · ${brandName}` : deal.dealName };
    });
  }, [deals, brandById]);

  // Check for localStorage migration
  useEffect(() => {
    const data = checkForLocalStorageData();
    if (data.events > 0) {
      setMigrationData(data);
    }
  }, []);

  // Load events from API
  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // Also load campaigns for display (they might still be in localStorage)
    const loadedCampaigns = safeRead("break_admin_crm_campaigns_v1", []);
    setCampaigns(loadedCampaigns);
    setDeals(readCrmDeals());
  }, []);

  const handleMigrate = async () => {
    if (!migrationData || isMigrating) return;
    setIsMigrating(true);
    try {
      await migrateLocalStorageToDatabase();
      await clearLocalStorageData();
      setMigrationData(null);
      await loadEvents();
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
    loadEvents();
    setDeals(readCrmDeals());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerId, createOpen]);

  const [createForm, setCreateForm] = useState({
    eventName: "",
    eventType: EVENT_TYPES[0],
    status: "Planned",
    startDateTime: "",
    endDateTime: "",
    location: "",
    internalSummary: "",
    brandId: "",
    campaignId: "",
    dealId: "",
    owner: session?.name || session?.email?.split("@")[0] || "Admin"
  });

  const view = searchParams.get("view") || "upcoming"; // upcoming | past
  const filterBrandId = searchParams.get("brandId") || "";
  const filterCampaignId = searchParams.get("campaignId") || "";
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const visibleEvents = useMemo(() => {
    const now = new Date();
    const filtered = (events || [])
      .filter((e) => {
        if (view === "upcoming") return isUpcomingEvent(e, now);
        if (view === "past") return isPastEvent(e, now);
        return true;
      })
      .filter((e) => (filterBrandId ? e.brandId === filterBrandId : true))
      .filter((e) => (filterCampaignId ? e.campaignId === filterCampaignId : true))
      .filter((e) => {
        if (!query) return true;
        const brandName = e.brandId ? brandById.get(e.brandId)?.brandName || brandById.get(e.brandId)?.name || "" : "";
        const campaignName = e.campaignId ? campaignById.get(e.campaignId)?.campaignName || "" : "";
        return (
          (e.eventName || "").toLowerCase().includes(query) ||
          (e.eventType || "").toLowerCase().includes(query) ||
          brandName.toLowerCase().includes(query) ||
          campaignName.toLowerCase().includes(query)
        );
      });

    const sorted = filtered.sort((a, b) => {
      const aTime = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const bTime = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return view === "past" ? bTime - aTime : aTime - bTime;
    });
    return sorted;
  }, [events, view, filterBrandId, filterCampaignId, query, brandById, campaignById]);

  const selectedEvent = useMemo(() => events.find((e) => e.id === drawerId) || null, [events, drawerId]);
  const selectedBrand = selectedEvent?.brandId ? brandById.get(selectedEvent.brandId) : null;
  const selectedCampaign = selectedEvent?.campaignId ? campaignById.get(selectedEvent.campaignId) : null;
  const selectedDeal = selectedEvent?.dealId ? dealById.get(selectedEvent.dealId) : null;

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
      eventName: "",
      startDateTime: "",
      endDateTime: "",
      location: "",
      internalSummary: "",
      brandId: opts.brandId || prev.brandId || "",
      campaignId: opts.campaignId || prev.campaignId || "",
      dealId: opts.dealId || prev.dealId || "",
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
      next.delete("campaignId");
      return next;
    });
  };

  const createNewEvent = async () => {
    const name = createForm.eventName.trim();
    if (!name) return;
    const createdAt = nowIso();
    const event = {
      id: `evt-${Date.now()}`,
      eventName: name,
      eventType: createForm.eventType,
      status: createForm.status,
      startDateTime: createForm.startDateTime || null,
      endDateTime: createForm.endDateTime || null,
      location: createForm.location || "",
      internalSummary: createForm.internalSummary || "",
      brandId: createForm.brandId || null,
      campaignId: createForm.campaignId || null,
      dealId: createForm.dealId || null,
      linkedDealIds: createForm.dealId ? [createForm.dealId] : [],
      owner: createForm.owner || "Admin",
      createdAt,
      updatedAt: createdAt,
      attendeeTalentIds: [],
      attendeeTeamIds: [],
      linkedTaskIds: [],
      linkedOutreachIds: [],
      notes: "",
      activity: [{ at: createdAt, label: "Event created" }]
    };
    try {
      const created = await createEvent(event);
      await loadEvents();
      setCreateOpen(false);
      openDrawer(created.id);
    } catch (err) {
      console.error("Failed to create event:", err);
      alert("Failed to create event");
    }
  };

  const handleUpdateEvent = async (patch) => {
    if (!selectedEvent) return;
    const next = { ...selectedEvent, ...patch, updatedAt: nowIso() };
    try {
      await updateEvent(selectedEvent.id, patch);
      await loadEvents();
    } catch (err) {
      console.error("Failed to update event:", err);
      alert("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Delete this event permanently?")) return;
    try {
      await deleteEvent(eventId);
      await loadEvents();
      if (drawerId === eventId) closeDrawer();
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event");
    }
  };

  return (
    <DashboardShell
      title="Events"
      subtitle="Intentional moments that spawn prep, attendance, and follow-through — beyond calendar slots."
      navLinks={ADMIN_NAV_LINKS}
    >
      {migrationData && migrationData.events > 0 && (
        <div className="mb-4 rounded-3xl border border-amber-500/30 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-900">Local storage migration available</p>
              <p className="mt-1 text-sm text-amber-800">
                Found {migrationData.events} event(s) in browser storage. Migrate to database?
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
            <h2 className="font-display text-3xl uppercase text-brand-black">Events</h2>
            <p className="mt-2 text-sm text-brand-black/60">
              Context-rich moments: dinners, trips, panels, previews — and the follow-up that matters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextButton onClick={() => navigate("/admin/campaigns")}>Open campaigns</TextButton>
            <PrimaryButton onClick={() => openCreate()}>Create event</PrimaryButton>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("view", "upcoming");
                  return next;
                })
              }
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border",
                view === "upcoming" ? "bg-brand-black text-brand-white border-brand-black" : "border-brand-black/20 text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("view", "past");
                  return next;
                })
              }
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border",
                view === "past" ? "bg-brand-black text-brand-white border-brand-black" : "border-brand-black/20 text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Past
            </button>
            {filterBrandId ? <Pill>Brand filter active</Pill> : null}
            {filterCampaignId ? <Pill>Campaign filter active</Pill> : null}
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
            placeholder="Search events, brands, campaigns…"
            className="w-full max-w-md rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            label="By campaign"
            value={filterCampaignId}
            onChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set("campaignId", v);
                else next.delete("campaignId");
                return next;
              })
            }
            options={[
              { value: "", label: "All campaigns" },
              ...campaigns.map((c) => ({ value: c.id, label: c.campaignName }))
            ]}
          />
          <p className="ml-auto text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
            {visibleEvents.length} shown
          </p>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="text-sm text-brand-black/70">Loading events...</p>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="font-display text-3xl uppercase text-brand-black">No events yet</p>
            <p className="mt-3 text-sm text-brand-black/70">
              Add brand moments, trips, or talks to manage prep and follow-up clearly.
            </p>
            <div className="mt-6 flex justify-center">
              <PrimaryButton onClick={() => openCreate()}>Create event</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visibleEvents.map((event) => {
              const brand = event.brandId ? brandById.get(event.brandId) : null;
              const campaign = event.campaignId ? campaignById.get(event.campaignId) : null;
              return (
                <article key={event.id} className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <EventChip name={event.eventName} status={event.status} />
                        <Pill>
                          {eventTypeIcon(event.eventType)} {event.eventType}
                        </Pill>
                        <Pill>{event.status}</Pill>
                        {event.startDateTime ? (
                          <span className="text-[0.7rem] uppercase tracking-[0.35em] text-brand-black/50">
                            {formatEventDateTimeRange({ startDateTime: event.startDateTime, endDateTime: event.endDateTime })}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {brand ? <BrandChip name={brand.brandName || brand.name} status={brand.status || "Active"} size="sm" /> : null}
                        {campaign ? <CampaignChip name={campaign.campaignName} status={campaign.status} size="sm" /> : null}
                        <Pill>Owner: {event.owner || "—"}</Pill>
                      </div>

                      <p className="mt-3 text-sm text-brand-black/70">
                        {(event.internalSummary || "").trim() ? event.internalSummary.trim() : "Add calm context: who, why, and what matters."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <TextButton onClick={() => openDrawer(event.id)}>Open</TextButton>
                      <ActionsMenu onOpen={() => openDrawer(event.id)} onDelete={() => handleDeleteEvent(event.id)} />
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
        title="Create event"
        subtitle="Events"
        onClose={closeCreate}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <TextButton onClick={closeCreate}>Cancel</TextButton>
            <PrimaryButton onClick={createNewEvent} disabled={!createForm.eventName.trim() || !createForm.startDateTime}>
              Create event
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Event name"
            required
            value={createForm.eventName}
            onChange={(v) => setCreateForm((p) => ({ ...p, eventName: v }))}
            placeholder="e.g. Maison Orion Press Preview"
          />
          <Select
            label="Event type"
            value={createForm.eventType}
            onChange={(v) => setCreateForm((p) => ({ ...p, eventType: v }))}
            options={EVENT_TYPES}
          />
          <Select
            label="Status"
            value={createForm.status}
            onChange={(v) => setCreateForm((p) => ({ ...p, status: v }))}
            options={EVENT_STATUSES}
          />
          <Field
            label="Owner"
            value={createForm.owner}
            onChange={(v) => setCreateForm((p) => ({ ...p, owner: v }))}
            placeholder="Agent / admin"
          />
          <Field
            label="Start date/time"
            required
            type="datetime-local"
            value={createForm.startDateTime || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, startDateTime: v }))}
          />
          <Field
            label="End date/time (optional)"
            type="datetime-local"
            value={createForm.endDateTime || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, endDateTime: v }))}
          />
          <Field
            label="Location"
            value={createForm.location}
            onChange={(v) => setCreateForm((p) => ({ ...p, location: v }))}
            placeholder="Text or link"
          />
          <Select
            label="Brand (optional)"
            value={createForm.brandId || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, brandId: v }))}
            options={[
              { value: "", label: "None" },
              ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))
            ]}
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
            label="Deal (optional)"
            value={createForm.dealId || ""}
            onChange={(v) => setCreateForm((p) => ({ ...p, dealId: v }))}
            options={[{ value: "", label: "None" }, ...dealOptions]}
          />
        </div>
        <TextArea
          label="Internal summary"
          value={createForm.internalSummary}
          onChange={(v) => setCreateForm((p) => ({ ...p, internalSummary: v }))}
          placeholder="Short description (internal)."
          rows={3}
        />
      </ModalFrame>

      <Drawer
        open={Boolean(selectedEvent)}
        title={selectedEvent?.eventName || "Event"}
        subtitle="Events"
        onClose={closeDrawer}
        actions={
          selectedEvent ? (
            <TextButton
              onClick={async () => {
                const duplicated = {
                  ...selectedEvent,
                  id: `evt-${Date.now()}`,
                  eventName: `${selectedEvent.eventName} (copy)`,
                  createdAt: nowIso(),
                  updatedAt: nowIso(),
                  activity: [{ at: nowIso(), label: "Event created" }]
                };
                try {
                  const created = await createEvent(duplicated);
                  await loadEvents();
                  openDrawer(created.id);
                } catch (err) {
                  console.error("Failed to duplicate event:", err);
                  alert("Failed to duplicate event");
                }
              }}
            >
              Duplicate
            </TextButton>
          ) : null
        }
      >
        {selectedEvent ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <EventChip name={selectedEvent.eventName} status={selectedEvent.status} />
                  <Pill>{selectedEvent.status}</Pill>
                  <Pill>{selectedEvent.eventType}</Pill>
                  {selectedEvent.startDateTime ? (
                    <Pill>{formatEventDateTimeRange({ startDateTime: selectedEvent.startDateTime, endDateTime: selectedEvent.endDateTime })}</Pill>
                  ) : null}
                </div>
                <Pill>Owner: {selectedEvent.owner || "—"}</Pill>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Select
                  label="Status"
                  value={selectedEvent.status}
                  onChange={(v) => handleUpdateEvent({ status: v })}
                  options={EVENT_STATUSES}
                />
                <Select
                  label="Event type"
                  value={selectedEvent.eventType}
                  onChange={(v) => handleUpdateEvent({ eventType: v })}
                  options={EVENT_TYPES}
                />
                <Field
                  label="Start date/time"
                  type="datetime-local"
                  value={selectedEvent.startDateTime || ""}
                  onChange={(v) => handleUpdateEvent({ startDateTime: v })}
                />
                <Field
                  label="End date/time"
                  type="datetime-local"
                  value={selectedEvent.endDateTime || ""}
                  onChange={(v) => handleUpdateEvent({ endDateTime: v })}
                />
                <Field
                  label="Location"
                  value={selectedEvent.location || ""}
                  onChange={(v) => handleUpdateEvent({ location: v })}
                  placeholder="Text or link"
                />
                <Field
                  label="Owner"
                  value={selectedEvent.owner || ""}
                  onChange={(v) => handleUpdateEvent({ owner: v })}
                  placeholder="Agent / admin"
                />
                <Select
                  label="Brand (optional)"
                  value={selectedEvent.brandId || ""}
                  onChange={(v) => handleUpdateEvent({ brandId: v || null })}
                  options={[
                    { value: "", label: "None" },
                    ...brands.map((b) => ({ value: b.id, label: b.brandName || b.name }))
                  ]}
                />
                <Select
                  label="Campaign (optional)"
                  value={selectedEvent.campaignId || ""}
                  onChange={(v) => handleUpdateEvent({ campaignId: v || null })}
                  options={[
                    { value: "", label: "None" },
                    ...campaigns.map((c) => ({ value: c.id, label: c.campaignName }))
                  ]}
                />
                <Select
                  label="Deal (optional)"
                  value={selectedEvent.dealId || ""}
                  onChange={(v) => handleUpdateEvent({ dealId: v || null })}
                  options={[{ value: "", label: "None" }, ...dealOptions]}
                />
              </div>

              <div className="mt-4 grid gap-3">
                <TextArea
                  label="Internal summary"
                  value={selectedEvent.internalSummary || ""}
                  onChange={(v) => handleUpdateEvent({ internalSummary: v })}
                  placeholder="Short description (internal)."
                  rows={3}
                />
                <TextArea
                  label="Notes"
                  value={selectedEvent.notes || ""}
                  onChange={(v) => handleUpdateEvent({ notes: v })}
                  placeholder="Context, expectations, sensitivities."
                  rows={4}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedBrand ? <BrandChip name={selectedBrand.brandName || selectedBrand.name} status={selectedBrand.status || "Active"} size="sm" /> : null}
                {selectedCampaign ? <CampaignChip name={selectedCampaign.campaignName} status={selectedCampaign.status} size="sm" /> : null}
                {selectedDeal ? <DealChip name={selectedDeal.dealName} status={selectedDeal.status} size="sm" /> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Deal</p>
                  <p className="mt-1 text-sm text-brand-black/60">Optional, but recommended when the moment is commercial.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDeal ? (
                    <TextButton onClick={() => navigate(`/admin/deals?open=${encodeURIComponent(selectedDeal.id)}`)}>
                      Open deal
                    </TextButton>
                  ) : null}
                  <TextButton
                    onClick={() =>
                      navigate(
                        `/admin/deals?create=1&brandId=${encodeURIComponent(selectedEvent.brandId || "")}&campaignId=${encodeURIComponent(
                          selectedEvent.campaignId || ""
                        )}`
                      )
                    }
                  >
                    Create deal
                  </TextButton>
                </div>
              </div>
              {selectedDeal ? (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <DealChip name={selectedDeal.dealName} status={selectedDeal.status} size="sm" />
                      <Pill>{selectedDeal.estimatedValueBand || "£"}</Pill>
                      <Pill>{selectedDeal.status}</Pill>
                    </div>
                    <TextButton onClick={() => handleUpdateEvent({ dealId: null })}>Unlink</TextButton>
                  </div>
                  <p className="mt-3 text-sm text-brand-black/70">
                    {(selectedDeal.internalSummary || "").trim() ? selectedDeal.internalSummary.trim() : "No deal summary yet."}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-sm text-brand-black/70">
                    No deal linked. Events can be standalone, but linking keeps follow-through commercially anchored.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Attendance</p>
                  <p className="mt-1 text-sm text-brand-black/60">Design-only: RSVP visibility without ticketing.</p>
                </div>
                <TextButton disabled title="Coming soon">Add attendee</TextButton>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Talent attending</p>
                  <p className="mt-2 text-sm text-brand-black/60">Chips will appear here later.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Internal team</p>
                  <p className="mt-2 text-sm text-brand-black/60">Chips will appear here later.</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Tasks</p>
                  <p className="mt-1 text-sm text-brand-black/60">Critical follow-through. Bundles are placeholders for now.</p>
                </div>
                <TextButton disabled title="Coming soon">Add task bundle</TextButton>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/70">No tasks linked yet.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {["Event prep", "Post-event follow-up"].map((bundle) => (
                    <div key={bundle} className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-3">
                      <p className="text-sm font-semibold text-brand-black">{bundle}</p>
                      <p className="mt-1 text-xs text-brand-black/60">Auto-links tasks to this event (future).</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Outreach & follow-ups</p>
                  <p className="mt-1 text-sm text-brand-black/60">Invites, confirmations, thank-you notes. Calm continuity.</p>
                </div>
                <TextButton disabled title="Coming soon">Log outreach</TextButton>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm text-brand-black/60">No outreach linked yet.</p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Calm hints</p>
                  <p className="mt-1 text-sm text-brand-black/60">Small signals, not dashboards.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {buildHints(selectedEvent).map((hint) => (
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
                  <p className="mt-1 text-sm text-brand-black/60">Permanently delete this event.</p>
                </div>
                <TextButton onClick={() => handleDeleteEvent(selectedEvent.id)}>Delete event</TextButton>
              </div>
            </section>
          </>
        ) : null}
      </Drawer>
    </DashboardShell>
  );
}

export default AdminEventsPage;

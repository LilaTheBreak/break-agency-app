import React, { useMemo, useState, useEffect } from "react";
import { BrandChip } from "./BrandChip.jsx";
import { ContactChip } from "./ContactChip.jsx";
import { ContactSelect } from "./ContactSelect.jsx";
import { useContacts } from "../hooks/useContacts.js";
import {
  fetchBrands,
  fetchContacts,
  fetchOutreachRecords,
  createOutreachRecord,
  updateOutreachRecord,
  deleteOutreachRecord,
} from "../services/crmClient.js";

const DIRECTIONS = ["Outbound", "Inbound"];
const CHANNELS = ["Email", "WhatsApp", "Instagram", "LinkedIn", "Phone", "In-person", "Other"];
const OUTCOMES = ["No reply yet", "Warm response", "Declined", "In discussion", "Needs follow-up"];
const VISIBILITIES = ["Internal", "Talent-visible (future)"];

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

function Pill({ tone = "neutral", children }) {
  const toneClass =
    tone === "positive"
      ? "border-brand-black/10 bg-brand-white text-brand-black"
      : tone === "warning"
        ? "border-brand-black/10 bg-brand-white text-brand-black"
        : "border-brand-black/10 bg-brand-white text-brand-black/70";
  return (
    <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${toneClass}`}>
      {children}
    </span>
  );
}

function TextButton({ children, onClick, disabled = false, title }) {
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

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
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

function TextArea({ label, value, onChange, placeholder, rows = 6 }) {
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

function Drawer({ open, title, onClose, children, actions, eyebrow = "Outreach" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-brand-black/10 bg-brand-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{eyebrow}</p>
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

function DirectionPill({ direction }) {
  return <Pill tone="neutral">{direction === "Inbound" ? "In" : "Out"}</Pill>;
}

function ChannelPill({ channel }) {
  const label = channel === "In-person" ? "In person" : channel;
  return <Pill tone="neutral">{label}</Pill>;
}

function OutcomePill({ outcome }) {
  const tone = outcome === "Warm response" || outcome === "In discussion" ? "positive" : "neutral";
  return <Pill tone={tone}>{outcome}</Pill>;
}

function ActionsMenu({ onView, onEdit }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Outreach actions"
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
            View
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            Edit
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
            Link to deal (coming soon)
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function OutreachRecordsPanel({
  session,
  mode = "page",
  filter = {},
  limit,
  title = "Outreach records",
  subtitle = "Log meaningful touchpoints across email, DMs, intros, and conversations — without inbox pressure."
}) {
  const createdByDefault =
    session?.name?.split(" ")?.[0] || session?.email?.split("@")?.[0]?.split(".")?.[0] || "Admin";

  const [records, setRecords] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use canonical contacts hook
  const { contacts, isLoading: contactsLoading, createContact } = useContacts();

  const [query, setQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");

  const [detailId, setDetailId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create"); // create | edit
  const [editorTargetId, setEditorTargetId] = useState("");
  const [draft, setDraft] = useState({
    direction: "Outbound",
    channel: "Email",
    summary: "",
    fullNotes: "",
    brandId: filter.brandId || "",
    contactId: filter.contactId || "",
    dealId: filter.dealId || "",
    campaignId: "",
    talentId: "",
    outcome: "No reply yet",
    followUpSuggested: false,
    followUpBy: "",
    visibility: "Internal"
  });

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [recordsData, brandsData] = await Promise.all([
          fetchOutreachRecords(filter),
          fetchBrands(),
          // Contacts now loaded via useContacts hook
        ]);
        setRecords(recordsData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Failed to load outreach data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filter.brandId, filter.contactId, filter.dealId]);

  const refreshData = async () => {
    try {
      const recordsData = await fetchOutreachRecords(filter);
      setRecords(recordsData);
    } catch (error) {
      console.error('Failed to refresh records:', error);
    }
  };

  const brandById = useMemo(() => {
    const map = new Map();
    const safeBrands = Array.isArray(brands) ? brands : [];
    safeBrands.forEach((b) => map.set(b.id, b));
    return map;
  }, [brands]);

  const contactById = useMemo(() => {
    const map = new Map();
    const safeContacts = Array.isArray(contacts) ? contacts : [];
    safeContacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byLink = (r) => {
      if (filter.brandId && r.brandId !== filter.brandId) return false;
      if (filter.contactId && r.contactId !== filter.contactId) return false;
      if (filter.dealId && r.dealId !== filter.dealId) return false;
      return true;
    };
    return (records || [])
      .filter(byLink)
      .filter((r) => (outcomeFilter === "All" ? true : r.outcome === outcomeFilter))
      .filter((r) => (channelFilter === "All" ? true : r.channel === channelFilter))
      .filter((r) => {
        if (!q) return true;
        const brand = r.brandId ? brandById.get(r.brandId) : null;
        const contact = r.contactId ? contactById.get(r.contactId) : null;
        const haystack = [
          r.summary,
          r.fullNotes,
          r.channel,
          r.outcome,
          brand?.brandName,
          contact ? `${contact.firstName} ${contact.lastName}` : ""
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, limit ? Number(limit) : undefined);
  }, [records, filter, outcomeFilter, channelFilter, query, brandById, contactById, limit]);

  const selected = useMemo(() => (records || []).find((r) => r.id === detailId) || null, [records, detailId]);

  const openCreate = (prefill = {}) => {
    setEditorMode("create");
    setEditorTargetId("");
    setDraft({
      direction: prefill.direction || "Outbound",
      channel: prefill.channel || "Email",
      summary: "",
      fullNotes: "",
      brandId: prefill.brandId || filter.brandId || "",
      contactId: prefill.contactId || filter.contactId || "",
      dealId: prefill.dealId || filter.dealId || "",
      campaignId: "",
      talentId: "",
      outcome: "No reply yet",
      followUpSuggested: false,
      followUpBy: "",
      visibility: "Internal"
    });
    setEditorOpen(true);
  };

  const openEdit = (record) => {
    setEditorMode("edit");
    setEditorTargetId(record.id);
    setDraft({
      direction: record.direction || "Outbound",
      channel: record.channel || "Email",
      summary: record.summary || "",
      fullNotes: record.fullNotes || "",
      brandId: record.brandId || "",
      contactId: record.contactId || "",
      dealId: record.dealId || "",
      campaignId: record.campaignId || "",
      talentId: record.talentId || "",
      outcome: record.outcome || "No reply yet",
      followUpSuggested: Boolean(record.followUpSuggested),
      followUpBy: record.followUpBy || "",
      visibility: record.visibility || "Internal"
    });
    setEditorOpen(true);
  };

  const upsert = async () => {
    const summary = draft.summary.trim();
    if (!summary) return;
    if (!draft.brandId) return;
    const followUpSuggested = Boolean(draft.followUpSuggested || draft.followUpBy || draft.outcome === "Needs follow-up");
    if (editorMode === "create") {
      try {
        setLoading(true);
        const recordData = {
          direction: draft.direction,
          channel: draft.channel,
          summary,
          fullNotes: draft.fullNotes,
          brandId: draft.brandId,
          contactId: draft.contactId || null,
          dealId: draft.dealId || null,
          campaignId: draft.campaignId || null,
          talentId: draft.talentId || null,
          outcome: draft.outcome,
          followUpSuggested,
          followUpBy: draft.followUpBy || null,
          createdBy: createdByDefault,
          visibility: draft.visibility || "Internal"
        };
        const newRecord = await createOutreachRecord(recordData);
        await refreshData();
        setEditorOpen(false);
        setDetailId(newRecord.id);
      } catch (error) {
        console.error('Failed to create outreach record:', error);
        alert('Failed to create outreach record. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    const id = editorTargetId;
    if (!id) return;
    try {
      setLoading(true);
      const recordData = {
        direction: draft.direction,
        channel: draft.channel,
        summary,
        fullNotes: draft.fullNotes,
        brandId: draft.brandId,
        contactId: draft.contactId || null,
        dealId: draft.dealId || null,
        campaignId: draft.campaignId || null,
        talentId: draft.talentId || null,
        outcome: draft.outcome,
        followUpSuggested,
        followUpBy: draft.followUpBy || null,
        visibility: draft.visibility || "Internal"
      };
      await updateOutreachRecord(id, recordData);
      await refreshData();
      setEditorOpen(false);
    } catch (error) {
      console.error('Failed to update outreach record:', error);
      alert('Failed to update outreach record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableContacts = useMemo(() => {
    if (!draft.brandId) return [];
    const safeContacts = Array.isArray(contacts) ? contacts : [];
    return safeContacts.filter((c) => c.brandId === draft.brandId);
  }, [contacts, draft.brandId]);

  const selectedBrand = selected?.brandId ? brandById.get(selected.brandId) : null;
  const selectedContact = selected?.contactId ? contactById.get(selected.contactId) : null;

  const headerVisible = mode === "page";
  const showFilters = mode === "page";
  const showEmptyState = mode === "page";

  return (
    <div className={mode === "embedded" ? "" : "space-y-6"}>
      {headerVisible ? (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Outreach</p>
              <h2 className="font-display text-3xl uppercase text-brand-black">{title}</h2>
              <p className="mt-1 text-sm text-brand-black/70">{subtitle}</p>
            </div>
            <PrimaryButton onClick={() => openCreate()}>Log outreach</PrimaryButton>
          </div>

          {showFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70">
                <span className="text-brand-black/60">Search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Summary, brand, contact…"
                  className="w-56 bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none placeholder:text-brand-black/30"
                />
              </label>
              <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70">
                <span className="text-brand-black/60">Outcome</span>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none"
                >
                  {["All", ...OUTCOMES].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70">
                <span className="text-brand-black/60">Channel</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="bg-transparent text-xs uppercase tracking-[0.3em] text-brand-black outline-none"
                >
                  {["All", ...CHANNELS].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <TextButton
                onClick={() => {
                  setQuery("");
                  setOutcomeFilter("All");
                  setChannelFilter("All");
                }}
              >
                Reset
              </TextButton>
            </div>
          ) : null}
        </section>
      ) : null}

      {filtered.length === 0 ? (
        showEmptyState ? (
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
            <p className="font-display text-3xl uppercase text-brand-black">No outreach logged yet</p>
            <p className="mt-3 text-sm text-brand-black/70">
              Record conversations and messages to keep relationships moving — even if they happened off-platform.
            </p>
            <div className="mt-6 flex justify-center">
              <PrimaryButton onClick={() => openCreate()}>Log outreach</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-brand-black/70">No outreach logged yet.</p>
              <TextButton onClick={() => openCreate()}>{mode === "embedded" ? "Log" : "Log outreach"}</TextButton>
            </div>
          </div>
        )
      ) : (
        <div className={mode === "embedded" ? "space-y-2" : "space-y-3"}>
          {filtered.map((r) => {
            const brand = r.brandId ? brandById.get(r.brandId) : null;
            const contact = r.contactId ? contactById.get(r.contactId) : null;
            return (
              <article
                key={r.id}
                className={
                  mode === "embedded"
                    ? "rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                    : "rounded-3xl border border-brand-black/10 bg-brand-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_25px_80px_rgba(0,0,0,0.08)]"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <DirectionPill direction={r.direction} />
                      <ChannelPill channel={r.channel} />
                      <OutcomePill outcome={r.outcome} />
                      {r.followUpSuggested ? <Pill tone="warning">Follow-up</Pill> : null}
                    </div>
                    <p className="text-sm font-semibold text-brand-black">{r.summary}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {brand?.brandName ? <BrandChip name={brand.brandName} status={brand.status || "Active"} size="sm" /> : null}
                      {contact ? (
                        <ContactChip
                          firstName={contact.firstName}
                          lastName={contact.lastName}
                          status={contact.relationshipStatus || "New"}
                          primary={Boolean(contact.primaryContact)}
                          size="sm"
                        />
                      ) : null}
                      {mode === "page" && brand?.website ? (
                        <a
                          href={toExternalUrl(brand.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs uppercase tracking-[0.25em] text-brand-black/50 underline underline-offset-4 hover:text-brand-black"
                        >
                          Website
                        </a>
                      ) : null}
                    </div>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-black/50">
                      {formatWhen(r.createdAt)} • {r.createdBy || "Admin"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TextButton onClick={() => setDetailId(r.id)}>Open</TextButton>
                    {mode === "page" ? <ActionsMenu onView={() => setDetailId(r.id)} onEdit={() => openEdit(r)} /> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Drawer
        open={Boolean(selected)}
        title={selected?.summary || "Outreach"}
        onClose={() => setDetailId("")}
        actions={
          selected ? (
            <TextButton
              onClick={() => {
                setDetailId(selected.id);
                openEdit(selected);
              }}
            >
              Edit
            </TextButton>
          ) : null
        }
      >
        {selected ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Overview</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <DirectionPill direction={selected.direction} />
                <ChannelPill channel={selected.channel} />
                <OutcomePill outcome={selected.outcome} />
                <Pill tone="neutral">{formatWhen(selected.createdAt)}</Pill>
              </div>
              <p className="mt-3 text-sm text-brand-black/80">{selected.summary}</p>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Linked context</p>
                  <p className="mt-1 text-sm text-brand-black/60">CRM-native links (no inbox dependencies).</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedBrand?.brandName ? (
                  <BrandChip name={selectedBrand.brandName} status={selectedBrand.status || "Active"} />
                ) : (
                  <Pill tone="neutral">Brand: —</Pill>
                )}
                {selectedContact ? (
                  <ContactChip
                    firstName={selectedContact.firstName}
                    lastName={selectedContact.lastName}
                    status={selectedContact.relationshipStatus || "New"}
                    primary={Boolean(selectedContact.primaryContact)}
                  />
                ) : null}
                {selected.dealId ? <Pill tone="neutral">Deal: {selected.dealId}</Pill> : null}
                {selected.talentId ? <Pill tone="neutral">Talent: {selected.talentId}</Pill> : null}
                {selected.campaignId ? <Pill tone="neutral">Campaign: {selected.campaignId}</Pill> : null}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Notes</p>
                  <p className="mt-1 text-sm text-brand-black/60">Private context, transcript snippets, or memory anchors.</p>
                </div>
                <Pill tone="neutral">{selected.visibility || "Internal"}</Pill>
              </div>
              <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="whitespace-pre-wrap text-sm text-brand-black/70">
                  {selected.fullNotes?.trim() ? selected.fullNotes.trim() : "No notes added."}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Follow-up</p>
                  <p className="mt-1 text-sm text-brand-black/60">Create tasks later; for now, keep the intent visible.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Suggested</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selected.followUpSuggested ? "Yes" : "No"}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Follow up by</p>
                  <p className="mt-2 text-sm text-brand-black/80">{selected.followUpBy ? selected.followUpBy : "—"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <TextButton disabled title="Coming soon">
                  Create follow-up task
                </TextButton>
              </div>
            </section>
          </>
        ) : null}
      </Drawer>

      <Drawer
        open={editorOpen}
        title={editorMode === "create" ? "Log outreach" : "Edit outreach"}
        onClose={() => setEditorOpen(false)}
        actions={<PrimaryButton onClick={upsert}>Save</PrimaryButton>}
        eyebrow="Outreach record"
      >
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Core</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Select label="Direction" value={draft.direction} onChange={(v) => setDraft((p) => ({ ...p, direction: v }))} options={DIRECTIONS} />
            <Select label="Channel" value={draft.channel} onChange={(v) => setDraft((p) => ({ ...p, channel: v }))} options={CHANNELS} />
            <Select label="Outcome" value={draft.outcome} onChange={(v) => setDraft((p) => ({ ...p, outcome: v }))} options={OUTCOMES} />
            <Select
              label="Visibility"
              value={draft.visibility}
              onChange={(v) => setDraft((p) => ({ ...p, visibility: v }))}
              options={VISIBILITIES}
            />
          </div>
          <div className="mt-4">
            <Field
              label="Summary (required)"
              value={draft.summary}
              onChange={(v) => setDraft((p) => ({ ...p, summary: v }))}
              placeholder="e.g. Intro email re summer campaign"
            />
          </div>
          <div className="mt-4">
            <TextArea
              label="Full notes (optional)"
              value={draft.fullNotes}
              onChange={(v) => setDraft((p) => ({ ...p, fullNotes: v }))}
              placeholder="Context, transcript, next steps…"
              rows={6}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Links</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Brand (required)</span>
              <select
                value={draft.brandId}
                onChange={(e) => {
                  const nextBrandId = e.target.value;
                  setDraft((p) => ({ ...p, brandId: nextBrandId, contactId: "" }));
                }}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
              >
                <option value="">Select brand…</option>
                {(Array.isArray(brands) ? brands : []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Contact (optional)</span>
              <div className="mt-2">
                <ContactSelect
                  contacts={availableContacts}
                  value={draft.contactId}
                  onChange={(v) => setDraft((p) => ({ ...p, contactId: v }))}
                  isLoading={contactsLoading}
                  onCreateContact={createContact}
                  brandId={draft.brandId}
                  disabled={!draft.brandId}
                />
                {!draft.brandId && (
                  <p className="mt-1 text-xs text-brand-black/50">Choose a brand first</p>
                )}
              </div>
            </label>

            <Field label="Deal ID (optional)" value={draft.dealId} onChange={(v) => setDraft((p) => ({ ...p, dealId: v }))} placeholder="e.g. deal_123" />
            <Field
              label="Talent ID (optional)"
              value={draft.talentId}
              onChange={(v) => setDraft((p) => ({ ...p, talentId: v }))}
              placeholder="future"
            />
            <Field
              label="Campaign ID (optional)"
              value={draft.campaignId}
              onChange={(v) => setDraft((p) => ({ ...p, campaignId: v }))}
              placeholder="future"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Follow-up</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Follow up by (optional)</span>
              <input
                type="date"
                value={draft.followUpBy}
                onChange={(e) => setDraft((p) => ({ ...p, followUpBy: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
              />
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3">
              <input
                id="followUpSuggested"
                type="checkbox"
                checked={Boolean(draft.followUpSuggested)}
                onChange={(e) => setDraft((p) => ({ ...p, followUpSuggested: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="followUpSuggested" className="text-sm text-brand-black/70">
                Mark follow-up needed
              </label>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default OutreachRecordsPanel;


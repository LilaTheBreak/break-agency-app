import React, { useEffect, useMemo, useState } from "react";
import { NoteCard } from "./NoteCard.jsx";
import { NOTE_TYPES, deleteCrmNote, listNotesForContext, upsertCrmNote, validateNote } from "../lib/crmNotes.js";

function nowIso() {
  return new Date().toISOString();
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
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
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

function HintCard({ children, onDismiss }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-3">
      <p className="text-sm text-brand-black/70">{children}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50 underline underline-offset-4 hover:text-brand-black"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

function buildGentleHints({ notes, pinnedCount }) {
  const hints = [];
  const typeCounts = notes.reduce((acc, n) => {
    const key = n.noteType || "";
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const frequentType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  if (pinnedCount === 0 && notes.length >= 3) hints.push("Consider pinning a high-signal preference or long-term context.");
  if (frequentType && frequentType[1] >= 3) hints.push(`“${frequentType[0]}” appears often here (design-only hint).`);
  if (notes.length >= 6) hints.push("Similar note may exist on another deal or brand (future cross-linking).");

  return hints.slice(0, 3);
}

export function NotesIntelligenceSection({
  title = "Notes & intelligence",
  subtitle = "Private margin notes — memory, not action.",
  context,
  session
}) {
  const brandId = context?.brandId || null;
  const contactId = context?.contactId || null;
  const dealId = context?.dealId || null;

  const [notes, setNotes] = useState(() => listNotesForContext({ brandId, contactId, dealId }));
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [dismissedHints, setDismissedHints] = useState(false);

  const createdBy =
    session?.name?.split(" ")?.[0] || session?.email?.split("@")?.[0]?.split(".")?.[0] || "Admin";

  useEffect(() => {
    setNotes(listNotesForContext({ brandId, contactId, dealId }));
  }, [brandId, contactId, dealId, composerOpen]);

  const sorted = useMemo(() => {
    const list = [...(notes || [])];
    list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const pinned = list.filter((n) => Boolean(n.pinned));
    const rest = list.filter((n) => !n.pinned);
    return { pinned, rest };
  }, [notes]);

  const hints = useMemo(() => buildGentleHints({ notes: notes || [], pinnedCount: sorted.pinned.length }), [notes, sorted.pinned.length]);

  const [draft, setDraft] = useState({
    noteText: "",
    noteType: "",
    pinned: false
  });

  const openAdd = () => {
    setEditingId("");
    setDraft({ noteText: "", noteType: "", pinned: false });
    setError("");
    setComposerOpen(true);
  };

  const openEdit = (note) => {
    setEditingId(note.id);
    setDraft({ noteText: note.noteText || "", noteType: note.noteType || "", pinned: Boolean(note.pinned) });
    setError("");
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setEditingId("");
    setError("");
  };

  const save = () => {
    const at = nowIso();
    const base = {
      id: editingId || `note-${Date.now()}`,
      noteText: draft.noteText,
      noteType: draft.noteType || null,
      brandId,
      contactId,
      dealId,
      visibility: "Internal only",
      createdAt: editingId ? (notes.find((n) => n.id === editingId)?.createdAt || at) : at,
      createdBy,
      pinned: Boolean(draft.pinned)
    };
    const verdict = validateNote(base);
    if (!verdict.ok) {
      setError(verdict.errors.join(" "));
      return;
    }
    upsertCrmNote(base);
    setNotes(listNotesForContext({ brandId, contactId, dealId }));
    setComposerOpen(false);
    setEditingId("");
  };

  const togglePin = (note) => {
    upsertCrmNote({ ...note, pinned: !note.pinned });
    setNotes(listNotesForContext({ brandId, contactId, dealId }));
  };

  const remove = (note) => {
    if (!confirm("Delete this note?")) return;
    deleteCrmNote(note.id);
    setNotes(listNotesForContext({ brandId, contactId, dealId }));
  };

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          <p className="mt-1 text-sm text-brand-black/60">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TextButton disabled title="Coming soon">Quick add</TextButton>
          <PrimaryButton onClick={openAdd}>Add note</PrimaryButton>
        </div>
      </div>

      {!dismissedHints && hints.length ? (
        <div className="mt-4 grid gap-2">
          {hints.map((hint, idx) => (
            <HintCard key={hint} onDismiss={idx === hints.length - 1 ? () => setDismissedHints(true) : null}>
              {hint}
            </HintCard>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {sorted.pinned.length ? (
          <div className="space-y-2">
            {sorted.pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onTogglePin={() => togglePin(note)}
                onDelete={() => remove(note)}
              />
            ))}
          </div>
        ) : null}

        {sorted.rest.length ? (
          <div className="space-y-2">
            {sorted.rest.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onTogglePin={() => togglePin(note)}
                onDelete={() => remove(note)}
              />
            ))}
          </div>
        ) : null}

        {sorted.pinned.length === 0 && sorted.rest.length === 0 ? (
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
            <p className="text-sm text-brand-black/70">No notes yet. Add calm context so the team doesn’t lose nuance.</p>
          </div>
        ) : null}
      </div>

      <ModalFrame
        open={composerOpen}
        title={editingId ? "Edit note" : "Add note"}
        subtitle="Notes & intelligence"
        onClose={closeComposer}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            {error ? <p className="mr-auto text-sm text-brand-red">{error}</p> : null}
            <TextButton onClick={closeComposer}>Cancel</TextButton>
            <PrimaryButton onClick={save} disabled={!draft.noteText.trim()}>
              Save note
            </PrimaryButton>
          </div>
        }
      >
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <p className="text-sm text-brand-black/80">Internal only. Notes are memory — they don’t create tasks by default.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Note type (optional)"
            value={draft.noteType || ""}
            onChange={(v) => setDraft((p) => ({ ...p, noteType: v }))}
            options={[{ value: "", label: "General" }, ...NOTE_TYPES.map((t) => ({ value: t, label: t }))]}
          />
          <label className="flex items-end gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(draft.pinned)}
              onChange={(e) => setDraft((p) => ({ ...p, pinned: e.target.checked }))}
            />
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Pin note</span>
          </label>
        </div>
        <TextArea
          label="Note text"
          value={draft.noteText}
          onChange={(v) => setDraft((p) => ({ ...p, noteText: v }))}
          placeholder="Preferences, nuance, what to remember next time…"
          rows={6}
        />
      </ModalFrame>
    </section>
  );
}


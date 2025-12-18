import React, { useMemo, useState } from "react";

function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ActionsMenu({ pinned, onEdit, onTogglePin, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
        aria-label="Note actions"
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-brand-black/10 bg-brand-white p-2 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onTogglePin?.();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left hover:bg-brand-black/5"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
          <div className="my-2 border-t border-brand-black/10" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete?.();
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

export function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  const [expanded, setExpanded] = useState(false);

  const body = (note?.noteText || "").trim();
  const long = body.length > 260;
  const display = useMemo(() => {
    if (expanded || !long) return body;
    return `${body.slice(0, 260).trim()}…`;
  }, [body, expanded, long]);

  return (
    <article className={`rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 ${note?.pinned ? "ring-1 ring-brand-black/20" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {note?.noteType ? (
              <span className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70">
                {note.noteType}
              </span>
            ) : null}
            {note?.pinned ? (
              <span className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black">
                Pinned
              </span>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-brand-black/80">{display || "—"}</p>
          {long ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 underline underline-offset-4 hover:text-brand-black"
            >
              {expanded ? "View less" : "View more"}
            </button>
          ) : null}
          <p className="mt-2 text-xs text-brand-black/60">
            {formatWhen(note?.createdAt)} • {note?.createdBy || "Admin"} • Internal only
          </p>
        </div>
        <ActionsMenu pinned={Boolean(note?.pinned)} onEdit={onEdit} onTogglePin={onTogglePin} onDelete={onDelete} />
      </div>
    </article>
  );
}


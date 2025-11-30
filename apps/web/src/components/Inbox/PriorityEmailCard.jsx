import React from "react";

const PRIORITY_STYLES = {
  high: "bg-brand-red/10 text-brand-red border-brand-red/30",
  medium: "bg-orange-100 text-orange-700 border-orange-300",
  low: "bg-brand-black/10 text-brand-black/70 border-brand-black/20"
};

export default function PriorityEmailCard({ item, onOpen }) {
  const priorityClass = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low;
  const snippet = (item.parsed?.body || "").slice(0, 120);
  const dateLabel = item.parsed?.date
    ? new Date(item.parsed.date).toLocaleString()
    : "Unknown date";

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item.id)}
      className="w-full text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${priorityClass}`}>
              {item.priority}
            </span>
            {item.scoring?.isOpportunity ? (
              <span className="rounded-full bg-brand-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-red">
                Opportunity
              </span>
            ) : null}
          </div>
          <p className="text-xs text-brand-black/60">{dateLabel}</p>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-sm font-semibold text-brand-black">{item.parsed?.from || "Unknown sender"}</p>
          <p className="text-base font-display uppercase text-brand-black">{item.parsed?.subject || "(No subject)"}</p>
          <p className="text-sm text-brand-black/70">{snippet}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-black/5 px-3 py-1 text-xs text-brand-black/70">
            Score: {item.scoring?.score ?? 0}
          </span>
          {(item.scoring?.labels || []).map((label) => (
            <span key={label} className="rounded-full bg-brand-linen px-3 py-1 text-xs text-brand-black/70">
              {label}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

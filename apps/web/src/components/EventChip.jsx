import React from "react";

const STATUS_STYLES = {
  Planned: "border-brand-black/10 bg-brand-white text-brand-black/70",
  Confirmed: "border-brand-black/10 bg-brand-white text-brand-black",
  Completed: "border-brand-black/10 bg-brand-white text-brand-black/60",
  Cancelled: "border-brand-black/10 bg-brand-white text-brand-black/60"
};

export function EventChip({ name, status = "Planned", size = "md" }) {
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-[0.65rem]" : "px-3 py-1 text-[0.7rem]";
  const style = STATUS_STYLES[status] || STATUS_STYLES.Planned;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${sizeClass} uppercase tracking-[0.3em] ${style}`}
      title={name}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
      <span className="max-w-[240px] truncate">{name}</span>
    </span>
  );
}


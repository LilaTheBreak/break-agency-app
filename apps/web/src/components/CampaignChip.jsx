import React from "react";

const STATUS_STYLES = {
  Draft: "border-brand-black/10 bg-brand-white text-brand-black/70",
  Active: "border-brand-black/10 bg-brand-white text-brand-black",
  Completed: "border-brand-black/10 bg-brand-white text-brand-black/60",
  Paused: "border-brand-black/10 bg-brand-white text-brand-black/60"
};

export function CampaignChip({ name, status = "Draft", size = "md" }) {
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-[0.65rem]" : "px-3 py-1 text-[0.7rem]";
  const style = STATUS_STYLES[status] || STATUS_STYLES.Draft;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${sizeClass} uppercase tracking-[0.3em] ${style}`}
      title={name}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
      <span className="max-w-[220px] truncate">{name}</span>
    </span>
  );
}


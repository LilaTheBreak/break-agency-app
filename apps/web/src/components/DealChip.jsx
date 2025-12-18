import React from "react";

const STATUS_STYLES = {
  Prospect: "border-brand-black/10 bg-brand-white text-brand-black/70",
  "In discussion": "border-brand-black/10 bg-brand-white text-brand-black",
  "Contract sent": "border-brand-black/10 bg-brand-white text-brand-black",
  Confirmed: "border-brand-black/10 bg-brand-white text-brand-black",
  Delivered: "border-brand-black/10 bg-brand-white text-brand-black/70",
  Invoiced: "border-brand-black/10 bg-brand-white text-brand-black/70",
  Paid: "border-brand-black/10 bg-brand-white text-brand-black/60",
  Lost: "border-brand-black/10 bg-brand-white text-brand-black/60"
};

export function DealChip({ name, status = "Prospect", size = "md" }) {
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-[0.65rem]" : "px-3 py-1 text-[0.7rem]";
  const style = STATUS_STYLES[status] || STATUS_STYLES.Prospect;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${sizeClass} uppercase tracking-[0.3em] ${style}`}
      title={name}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
      <span className="max-w-[260px] truncate">{name}</span>
    </span>
  );
}


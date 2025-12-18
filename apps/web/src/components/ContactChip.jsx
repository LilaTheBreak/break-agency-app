import React from "react";

const STATUS_STYLES = {
  New: "border-brand-black/10 bg-brand-white text-brand-black/70",
  Warm: "border-brand-black/10 bg-brand-white text-brand-black/80",
  Active: "border-brand-black/10 bg-brand-white text-brand-black",
  Dormant: "border-brand-black/10 bg-brand-white text-brand-black/60"
};

export function ContactChip({ firstName, lastName, status = "New", primary = false, size = "md" }) {
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-[0.65rem]" : "px-3 py-1 text-[0.7rem]";
  const style = STATUS_STYLES[status] || STATUS_STYLES.New;
  const label = `${firstName || ""} ${lastName || ""}`.trim() || "Contact";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${sizeClass} uppercase tracking-[0.3em] ${style}`}
      title={label}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
      <span className="max-w-[200px] truncate">{label}</span>
      {primary ? <span className="rounded-full border border-brand-black/10 bg-brand-white px-2 py-0.5 text-[0.55rem] tracking-[0.25em] text-brand-black/70">Primary</span> : null}
    </span>
  );
}

export default ContactChip;

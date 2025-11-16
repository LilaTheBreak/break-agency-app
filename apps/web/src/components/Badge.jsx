import React from "react";

const toneClasses = {
  neutral: "border-brand-black/20 text-brand-black/70 bg-brand-linen/40",
  positive: "border-brand-red/40 text-brand-red bg-brand-red/10",
  inverted: "border-brand-white/20 text-brand-white bg-transparent"
};

export function Badge({ children, tone = "neutral" }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] ${toneClasses[tone] || toneClasses.neutral}`}
    >
      {children}
    </span>
  );
}

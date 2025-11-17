import React from "react";

export function NoAccessCard({ title = "No access", description, badges = [] }) {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-brand-ivory px-6 py-12 text-center text-brand-black">
      <div className="max-w-2xl space-y-4 rounded-[32px] border border-brand-black/10 bg-brand-white/80 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
        <p className="font-subtitle text-xs uppercase tracking-[0.4em] text-brand-red">Access control</p>
        <h2 className="font-display text-3xl uppercase tracking-wide">{title}</h2>
        {description ? <p className="text-sm text-brand-black/70">{description}</p> : null}
        {badges.length ? (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-brand-black/50">
            {badges.map((label) => (
              <span key={label} className="rounded-full border border-brand-black/10 px-3 py-1">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

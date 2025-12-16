import React from "react";

const FILTERS = ["All", "Ops", "Brands", "Support", "Opportunities"];

export default function UgcMessagesPage() {
  return (
    <div className="bg-brand-ivory text-brand-black">
      <section className="mx-auto max-w-6xl px-6 py-16 space-y-4 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Creator messages</p>
        <h1 className="font-display text-4xl uppercase">UGC message center</h1>
        <p className="text-lg text-brand-black/70">
          Track every note from operations, brands, and our support team. Filters help you focus on the conversations that demand action.
        </p>
      </section>
      <section className="mx-auto max-w-6xl space-y-8 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className="rounded-full border border-brand-black/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black/5"
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="space-y-4 rounded-[32px] border border-brand-black/10 bg-brand-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-black/60">Placeholder</p>
          <p className="text-sm text-brand-black/70">
            Your messages will surface here as soon as creators, brands, or Ops ping your inbox. This area will eventually show actionable cards with filters for operations updates, brand brief changes, and support alerts.
          </p>
          <p className="text-sm text-brand-black/70">
            Need a higher signal? Keep your profile current so AI can route the right messages faster.
          </p>
        </div>
      </section>
    </div>
  );
}

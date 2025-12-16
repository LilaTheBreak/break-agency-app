import React from "react";
import { Link } from "react-router-dom";

export default function UgcFinancePage() {
  return (
    <div className="bg-brand-ivory text-brand-black">
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">UGC finance</p>
        <h1 className="font-display text-4xl uppercase">Payments & payouts</h1>
        <p className="text-lg text-brand-black/70">
          Monitor earned revenue, pending payouts, and invoices in one calm feed. We&apos;ll expand this dashboard
          with live totals soon — check back after you complete a brief.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/ugc/briefs"
            className="rounded-full border border-brand-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black hover:text-brand-white"
          >
            Back to briefs
          </Link>
          <Link
            to="/account/profile"
            className="rounded-full border border-brand-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black hover:text-brand-white"
          >
            Review my profile
          </Link>
        </div>
      </section>
    </div>
  );
}

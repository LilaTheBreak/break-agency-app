import React from "react";
import { Link } from "react-router-dom";

export default function UgcToolsPage() {
  return (
    <div className="bg-brand-ivory text-brand-black">
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">UGC tools</p>
        <h1 className="font-display text-4xl uppercase">Creator tools & resources</h1>
        <p className="text-lg text-brand-black/70">
          Access AI brief templates, shoot checklists, and performance dashboards to stay organised.
          We&apos;ll expand this space soon — for now explore more briefs or update your profile to unlock premium kits.
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

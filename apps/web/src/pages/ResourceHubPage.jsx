import React, { useMemo } from "react";
import { resourceItems } from "../data/platform.js";

export function ResourceHubPage() {
  const categories = useMemo(() => {
    const map = new Map();
    for (const item of resourceItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Resource hub</p>
          <h1 className="text-3xl font-semibold">Public intel, no login required.</h1>
          <p className="text-white/70">
            Articles, templates, digital products, and webinars curated for both sides of the
            marketplace. Spellcheck + QA baked into every onboarding doc.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        {categories.map(([category, items]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{category}</h2>
              <span className="text-xs uppercase tracking-[0.35em] text-white/50">Public</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{item.type}</span>
                    <span>{item.audience}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                  <button className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-brand-red">
                    {item.cta} →
                  </button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

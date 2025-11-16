import React from "react";
import { Badge } from "./Badge.jsx";
import { ugcBriefs } from "../data/platform.js";

export function UgcBoard({ canApply }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ugcBriefs.map((brief) => (
        <article
          key={brief.id}
          className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-brand"
        >
          <div className="flex items-center justify-between text-xs text-brand-black/60">
            <span className="font-subtitle uppercase tracking-[0.25em]">{brief.brand}</span>
            <span>{brief.region}</span>
          </div>
          <h3 className="mt-2 font-display text-2xl uppercase text-brand-black">{brief.title}</h3>
          <p className="mt-2 text-sm text-brand-black/80">{brief.deliverables.join(" • ")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-brand-black">
            <span>{brief.budget}</span>
            <span className="text-brand-black/60">Deadline: {brief.deadline}</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Badge tone={brief.status === "Open" ? "positive" : "neutral"}>{brief.status}</Badge>
            {canApply ? (
              <button className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brand-red">
                Apply →
              </button>
            ) : (
              <span className="text-xs text-brand-black/50">Login required to apply</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

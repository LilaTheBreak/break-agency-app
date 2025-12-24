import React from "react";
import { Link } from "react-router-dom";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

const STATUS_SECTIONS = [
  { label: "Applied", description: "Waiting for brand review" },
  { label: "Shortlisted", description: "Awaiting deliverable assignment" },
  { label: "Accepted", description: "Contracts & payments in flight" },
  { label: "Completed", description: "Deliverables signed off" }
];

function OpportunityCard({ opp }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border border-brand-black/10 bg-white shadow-[0_35px_120px_rgba(0,0,0,0.08)]">
      <div className="relative h-32 w-full">
        <img
          src={opp.coverPhoto || "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=900&q=80"}
          alt={opp.brand}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4 h-12 w-12 overflow-hidden rounded-2xl border border-white bg-white/70">
          <img src={opp.logo} alt={`${opp.brand} logo`} className="h-full w-full object-contain" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{opp.brand}</p>
        <h4 className="text-xl font-semibold text-brand-black">{opp.title}</h4>
        <p className="text-sm text-brand-black/70">{opp.requirements}</p>
        <p className="text-sm font-semibold text-brand-black">{opp.pay}</p>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{opp.apply}</p>
        <button
          className={`mt-auto rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] ${
            opp.tone === "caution" ? "border border-brand-red text-brand-red" : "bg-brand-red text-white"
          }`}
        >
          Apply via board
        </button>
      </div>
    </article>
  );
}

export default function UgcBriefsPage() {
  const opportunities = CONTROL_ROOM_PRESETS.ugc.opportunities;
  return (
    <div className="bg-brand-ivory text-brand-black">
      <section className="mx-auto max-w-6xl px-6 py-16 space-y-4 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">For creators</p>
        <h1 className="font-display text-4xl uppercase">Updated brief tracker</h1>
        <p className="text-lg text-brand-black/70">
          Track every status of your submissions. Applied, shortlisted, accepted, or completed — we keep the
          milestones front and center. Add more profile detail to surface higher-value opportunities.
        </p>
        <Link
          to="/account/profile?section=ugc"
          className="inline-flex items-center justify-center rounded-full border border-brand-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black hover:text-brand-white"
        >
          Review my profile
        </Link>
      </section>
      <section className="mx-auto max-w-6xl space-y-10 px-6 py-4">
        {STATUS_SECTIONS.map((section) => (
          <div key={section.label} className="rounded-[32px] border border-brand-black/10 bg-brand-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{section.label}</p>
                <p className="text-sm uppercase tracking-[0.35em] text-brand-black/60">{section.description}</p>
              </div>
              <button className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]">
                View ({0})
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {opportunities.slice(0, 3).map((opp) => (
                <OpportunityCard key={`${section.label}-${opp.title}`} opp={opp} />
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Discover more</p>
              <h2 className="font-display text-3xl uppercase">More opportunities</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Updated daily</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {opportunities.map((opp) => (
              <OpportunityCard key={`discover-${opp.title}`} opp={opp} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

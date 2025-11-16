import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";

const QUEUE = [
  { title: "VIP roster expansion", owner: "Lila Prasad", status: "Ready for review" },
  { title: "Luxury residency cohort", owner: "Mo Al Ghazi", status: "Contracts out" },
  { title: "AMA series with editors", owner: "Editorial Pod", status: "Planning" }
];

export function ExclusiveTalentDashboard() {
  return (
    <DashboardShell
      title="Exclusive Talent View"
      subtitle="Preview the creator-side experience for concierge-level talent."
      navigation={["Overview", "Lineup", "Proposals", "Communications", "Settings"]}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {["Invite-only creators", "Concierge requests", "Task queue"].map((label, idx) => (
          <div key={label} className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{label}</p>
            <p className="mt-2 font-display text-5xl uppercase text-brand-black">{[24, 9, 18][idx]}</p>
            <p className="text-sm text-brand-black/60">{["Active roster", "Pending uplifts", "Awaiting updates"][idx]}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Queues</p>
            <h3 className="font-display text-2xl uppercase">Exclusive requests</h3>
          </div>
          <button className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
            Dispatch update
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {QUEUE.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-brand-black">{item.title}</p>
                <p className="text-sm text-brand-black/60">Owner: {item.owner}</p>
              </div>
              <Badge tone="positive">{item.status}</Badge>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}

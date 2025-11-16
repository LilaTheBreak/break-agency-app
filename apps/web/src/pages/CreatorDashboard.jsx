import React from "react";
import { creatorMetrics } from "../data/platform.js";
import { Badge } from "../components/Badge.jsx";
import { UgcBoard } from "../components/UgcBoard.jsx";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorDashboard() {
  return (
    <DashboardShell
      title="Creator Dashboard"
      subtitle="Performance, AI deal support, calendars, revenue tools, and priority UGC briefs."
      navigation={["Dashboard", "Campaigns & Deals", "UGC Opportunities", "Messages", "Account"]}
    >
      <section className="grid gap-4 md:grid-cols-2">
        {creatorMetrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-brand">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-black/60">{metric.label}</p>
            <p className="mt-2 font-display text-4xl uppercase text-brand-black">{metric.value}</p>
            <p className="text-xs text-brand-red">{metric.delta}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">UGC Board (priority access)</h3>
          <Badge>Autofill enabled</Badge>
        </div>
        <UgcBoard canApply />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen p-5">
          <h4 className="text-lg font-semibold">Upcoming tasks</h4>
          <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
            <li>• Upload revised draft for Atlantis brief.</li>
            <li>• Confirm usage rights for fintech walkthrough.</li>
            <li>• Share invoice for Creator Concierge sprint.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen p-5">
          <h4 className="text-lg font-semibold">AI Agent</h4>
          <p className="mt-2 text-sm text-brand-black/70">
            Draft replies, reminders, and rate guidance based on campaign history. Logging out keeps
            prompts encrypted.
          </p>
          <button className="mt-4 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white">
            Open agent
          </button>
        </div>
      </section>
    </DashboardShell>
  );
}

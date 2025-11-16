import React from "react";
import { brandCampaigns } from "../data/platform.js";
import { Badge } from "../components/Badge.jsx";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function BrandDashboard() {
  return (
    <DashboardShell
      title="Brand Dashboard"
      subtitle="Campaign controls, creator match, contracts & invoices, messaging, reporting."
      navigation={["Dashboard", "Campaigns", "Creator Match", "Reports", "Messages", "Account"]}
    >
      <section className="space-y-4">
        {brandCampaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-brand">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-brand-black/60">{campaign.stage}</p>
                <h3 className="font-display text-2xl uppercase text-brand-black">{campaign.name}</h3>
              </div>
              <Badge>{campaign.status}</Badge>
            </div>
            <div className="mt-3 grid gap-4 text-sm text-brand-black/70 md:grid-cols-4">
              <Info label="Reach" value={campaign.reach} />
              <Info label="Creators" value={campaign.creators} />
              <Info label="Owner" value={campaign.owner} />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">Actions</p>
                <button className="rounded-full border border-brand-black/30 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen p-5">
          <h4 className="text-lg font-semibold">Creator Match</h4>
          <p className="mt-2 text-sm text-brand-black/70">
            AI-assisted recommendations with filters for geography, vertical, platform metrics, and
            compliance scores. Shortlists stay inside the brand console; UGC board never surfaces
            here.
          </p>
        </div>
        <div className="rounded-3xl border border-brand-black/10 bg-brand-linen p-5">
          <h4 className="text-lg font-semibold">Contracts & invoices</h4>
          <p className="mt-2 text-sm text-brand-black/70">
            Generate briefs, signatures, invoices, and payouts with guardrails. Spellcheck + QA
            checklist enforced.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</p>
      <p className="text-lg text-brand-black">{value}</p>
    </div>
  );
}

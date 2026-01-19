import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorCampaignsPage({ session }) {
  return (
    <DashboardShell
      title="Campaigns"
      subtitle="View and manage your active campaigns"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Active Campaigns</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Track all your current briefs, deliverables, and campaign timelines.
          </p>
          <div className="mt-6">
            <div className="rounded-xl bg-brand-linen/40 p-4 text-center">
              <p className="text-sm text-brand-black/60">No active campaigns yet</p>
              <p className="mt-1 text-xs text-brand-black/50">New opportunities will appear here as they're assigned to you</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Campaign Pipeline</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Signed briefs with budgets, deliverables, and direct messaging with brands.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Browse Available Briefs</p>
              <p className="text-sm text-brand-black/60">Discover new campaign opportunities matched to your profile</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Campaign History</p>
              <p className="text-sm text-brand-black/60">View completed campaigns and performance metrics</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

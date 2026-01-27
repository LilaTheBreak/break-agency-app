import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

export function CreatorCampaignsPage({ session }) {
  const { campaigns, loading, error } = useCampaigns({ session });
  const config = CONTROL_ROOM_PRESETS.talent;
  const navLinks = config.tabs || [];

  return (
    <DashboardShell
      title="Campaigns"
      subtitle="View and manage your active campaigns"
      role={session?.user?.role}
      navLinks={navLinks}
      session={session}    >
      <div className="space-y-6">
        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Active Campaigns</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Track all your current briefs, deliverables, and campaign timelines.
          </p>
          {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
          <div className="mt-6">
            {loading ? (
              <div className="rounded-xl bg-brand-linen/40 p-4 text-center">
                <p className="text-sm text-brand-black/60">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="rounded-xl bg-brand-linen/40 p-4 text-center">
                <p className="text-sm text-brand-black/60">No active campaigns yet</p>
                <p className="mt-1 text-xs text-brand-black/50">New opportunities will appear here as they're assigned to you</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-xl bg-brand-linen/40 p-4">
                    <p className="font-medium text-brand-black">{campaign.title}</p>
                    <p className="text-sm text-brand-black/60">Stage: {campaign.stage}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
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

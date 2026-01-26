import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

export function CreatorContractsPage({ session }) {
  const config = CONTROL_ROOM_PRESETS.talent;
  const navLinks = config.tabs || [];
  return (
    <DashboardShell
      title="Contracts"
      subtitle="Manage your agreements and legal documents"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Active Contracts</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Review signed agreements and contract details for all your campaigns.
          </p>
          <div className="mt-6">
            <div className="rounded-xl bg-brand-linen/40 p-4 text-center">
              <p className="text-sm text-brand-black/60">No contracts yet</p>
              <p className="mt-1 text-xs text-brand-black/50">Contracts will appear here when you accept campaign briefs</p>
            </div>
          </div>
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Contract Templates</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Standard contract terms and legal framework for your collaborations.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Creator Agreement</p>
              <p className="text-sm text-brand-black/60">Standard terms for content creation campaigns</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">IP Rights</p>
              <p className="text-sm text-brand-black/60">Ownership and usage rights for your content</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

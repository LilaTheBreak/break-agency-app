import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorAgentPage({ session }) {
  return (
    <DashboardShell
      title="AI Agent"
      subtitle="Manage your AI agent and automations"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">AI Agent Configuration</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Set up and manage your personal AI agent for handling briefs, rate cards, and automated responses.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Agent Status</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <p className="font-semibold text-brand-black">Active</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Agent Features</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Auto-Response Templates</p>
              <p className="text-sm text-brand-black/60">Manage pre-written responses for common requests</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Rate Card Automation</p>
              <p className="text-sm text-brand-black/60">Auto-update rate cards based on performance metrics</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Brief Tracking</p>
              <p className="text-sm text-brand-black/60">AI-powered brief organization and prioritization</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

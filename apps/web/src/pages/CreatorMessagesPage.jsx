import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorMessagesPage({ session }) {
  return (
    <DashboardShell
      title="Messages"
      subtitle="Direct messaging with brands and team"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Your Conversations</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Chat with brands about briefs, ask questions, and get campaign updates.
          </p>
          <div className="mt-6">
            <div className="rounded-xl bg-brand-linen/40 p-4 text-center">
              <p className="text-sm text-brand-black/60">No messages yet</p>
              <p className="mt-1 text-xs text-brand-black/50">Brand messages and campaign updates will appear here</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Message Types</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Campaign Briefs</p>
              <p className="text-sm text-brand-black/60">Direct communication from brand managers</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Feedback & Revisions</p>
              <p className="text-sm text-brand-black/60">Real-time feedback on your deliverables</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Payment & Admin</p>
              <p className="text-sm text-brand-black/60">Invoice and payment-related communications</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

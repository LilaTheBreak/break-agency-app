import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorCalendarPage({ session }) {
  return (
    <DashboardShell
      title="Calendar"
      subtitle="Manage your schedule and campaign deadlines"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Your Schedule</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            View and manage your campaign deadlines, delivery dates, and important milestones.
          </p>
          <div className="mt-6">
            <div className="rounded-xl bg-brand-linen/40 p-4 text-center">
              <p className="text-sm text-brand-black/60">No events scheduled</p>
              <p className="mt-1 text-xs text-brand-black/50">Calendar events will appear here as campaigns are assigned</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Upcoming Deadlines</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Delivery Dates</p>
              <p className="text-sm text-brand-black/60">Key content delivery milestones for active campaigns</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Revision Windows</p>
              <p className="text-sm text-brand-black/60">Time periods for client feedback and revisions</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Payment Schedules</p>
              <p className="text-sm text-brand-black/60">Invoice and payout dates for completed work</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

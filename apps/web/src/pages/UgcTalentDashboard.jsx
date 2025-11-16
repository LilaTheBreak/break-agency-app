import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function UgcTalentDashboard() {
  return (
    <DashboardShell
      title="UGC Talent View"
      subtitle="See the streamlined dashboard surface that approved UGC creators access."
      navigation={["Board", "Applications", "Content", "Messages", "Settings"]}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-6 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Coming soon</p>
        <h3 className="mt-3 font-display text-3xl uppercase">UGC creator console</h3>
        <p className="mt-2 text-sm text-brand-black/70">
          Admins will be able to impersonate a UGC talent account to debug briefs, verify onboarding, and issue support.
        </p>
      </section>
    </DashboardShell>
  );
}

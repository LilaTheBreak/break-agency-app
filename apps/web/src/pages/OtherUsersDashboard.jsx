import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function OtherUsersDashboard() {
  return (
    <DashboardShell
      title="Other Users View"
      subtitle="Placeholder surface for viewing additional platform roles (brands, talent managers, etc.)."
      navigation={["Overview", "Personas", "Audit", "Support", "Settings"]}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-6 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">In progress</p>
        <h3 className="mt-3 font-display text-3xl uppercase">Role switching hub</h3>
        <p className="mt-2 text-sm text-brand-black/70">
          We will expand this view so admins can simulate any non-exclusive persona without leaving the console.
        </p>
      </section>
    </DashboardShell>
  );
}

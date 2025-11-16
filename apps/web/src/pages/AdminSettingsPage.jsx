import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

export function AdminSettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Placeholder surface for configuring roles, integrations, and outbound comms."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="space-y-4">
        {["Access control", "Integrations", "Notifications"].map((section) => (
          <div
            key={section}
            className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
          >
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{section}</p>
            <p className="mt-2 text-sm text-brand-black/70">
              Configure {section.toLowerCase()} from here. We’ll flesh out the details later.
            </p>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}

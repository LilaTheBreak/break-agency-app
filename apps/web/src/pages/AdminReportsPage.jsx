import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ComingSoon } from "../components/ComingSoon.jsx";

export function AdminReportsPage() {
  return (
    <DashboardShell
      title="Reports"
      subtitle="Analytics, insights, and reporting dashboard"
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
        <ComingSoon
          feature="REPORTS_DASHBOARD"
          title="Reports Dashboard"
          description="Reports and analytics are coming soon. This will provide comprehensive insights into platform usage, revenue, campaigns, and performance metrics."
          variant="subtle"
        />
      </section>
    </DashboardShell>
  );
}


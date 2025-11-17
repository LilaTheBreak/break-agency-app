import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ContractsPanel } from "../components/ContractsPanel.jsx";

export function AdminContractsPage({ session }) {
  return (
    <DashboardShell
      title="Contracts"
      subtitle="Generate agreements, send signature requests, and monitor execution."
      navLinks={ADMIN_NAV_LINKS}
    >
      <ContractsPanel
        session={session}
        title="Contract workspace"
        description="Track every contract sent through PandaDoc and monitor signature progress."
      />
    </DashboardShell>
  );
}

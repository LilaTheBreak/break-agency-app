import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ContractsPanel } from "../components/ContractsPanel.jsx";

export function AdminContractsPage({ session }) {
  return (
    <DashboardShell
      title="Contracts"
      subtitle="Create, track, and manage all contracts across The Break."
      navLinks={ADMIN_NAV_LINKS}
    >
      <ContractsPanel
        session={session}
        title="Contracts workspace"
        description="Create, track, and manage all contracts across The Break."
      />
    </DashboardShell>
  );
}

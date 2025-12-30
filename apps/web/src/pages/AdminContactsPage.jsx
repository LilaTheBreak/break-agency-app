import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ComingSoon } from "../components/ComingSoon.jsx";

export function AdminContactsPage() {
  return (
    <DashboardShell
      title="Contacts"
      subtitle="Manage brand contacts and relationships"
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
        <ComingSoon
          feature="CONTACTS_MANAGEMENT"
          title="Contacts Management"
          description="Contact management is coming soon. This will allow you to manage brand contacts, relationships, and communication history."
          variant="subtle"
        />
      </section>
    </DashboardShell>
  );
}


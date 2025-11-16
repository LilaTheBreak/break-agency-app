import React from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

export function AdminUserFeedPage() {
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email || "");

  return (
    <DashboardShell
      title="User Feed"
      subtitle="Preview the platform surface as this persona. Future releases will mirror their dashboard."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 text-center">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Viewing as
        </p>
        <h3 className="mt-2 font-display text-3xl uppercase">{decodedEmail}</h3>
        <p className="mt-2 text-sm text-brand-black/70">
          This is a placeholder feed. We’ll connect it to the actual user’s dashboard shortly.
        </p>
        <Link
          to="/admin/users"
          className="mt-4 inline-flex rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          Back to users
        </Link>
      </section>
    </DashboardShell>
  );
}

import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const APPROVALS = [
  {
    title: "Creator residency NYC",
    type: "Contract",
    submittedBy: "brand@notion.com",
    eta: "Needs approval"
  },
  {
    title: "Q3 launch campaign brief",
    type: "Brief",
    submittedBy: "automation-pod@breakagency.com",
    eta: "Legal review"
  },
  {
    title: "Payment batch #248",
    type: "Finance",
    submittedBy: "finance@breakagency.com",
    eta: "Ready for payout"
  }
];

export function AdminApprovalsPage() {
  return (
    <DashboardShell
      title="Approvals"
      subtitle="Review and clear anything that needs a human sign-off."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="space-y-3">
        {APPROVALS.map((approval) => (
          <article
            key={approval.title}
            className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
          >
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              {approval.type}
            </p>
            <h3 className="mt-2 font-display text-2xl uppercase">{approval.title}</h3>
            <p className="text-sm text-brand-black/70">Submitted by {approval.submittedBy}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{approval.eta}</Badge>
              <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
                Review
              </button>
            </div>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}

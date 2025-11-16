import React from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const ADMIN_METRICS = [
  { label: "Active creators", value: "148", sub: "Onboarded + compliant" },
  { label: "Live campaigns", value: "32", sub: "Across 7 markets" },
  { label: "Pending briefs", value: "11", sub: "Awaiting approvals" }
];

const QUEUE = [
  {
    title: "Luxury hospitality roster",
    owner: "Mo Al Ghazi",
    status: "Ready for review"
  },
  {
    title: "Creator residency NYC",
    owner: "Lila Prasad",
    status: "Contracts out"
  },
  {
    title: "AI talent concierge",
    owner: "Automation Pod",
    status: "Collecting requirements"
  }
];

export function AdminDashboard() {
  return (
    <DashboardShell
      title="Admin Control Room"
      subtitle="Monitor pipelines, unblock campaigns, and dispatch briefings across the platform."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {ADMIN_METRICS.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{metric.label}</p>
            <p className="mt-2 font-display text-4xl uppercase text-brand-black">{metric.value}</p>
            <p className="text-sm text-brand-black/60">{metric.sub}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Queues</p>
            <h3 className="font-display text-2xl uppercase">What needs attention</h3>
          </div>
          <button className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
            Dispatch update
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {QUEUE.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-brand-black">{item.title}</p>
                <p className="text-sm text-brand-black/60">Owner: {item.owner}</p>
              </div>
              <Badge tone="positive">{item.status}</Badge>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Overview",
            copy: "Snapshot of adoption, usage, and alerts for the last 7 days.",
            to: "/admin/dashboard"
          },
          {
            title: "Queues",
            copy: "Incoming approvals, onboarding, and support requests awaiting routing.",
            to: "/admin/queues"
          },
          {
            title: "Approvals",
            copy: "White-glove review of contracts, briefs, and payments before they go live.",
            to: "/admin/approvals"
          },
          {
            title: "Users",
            copy: "Audit creator, brand, and manager accounts. Impersonate or edit roles quickly.",
            to: "/admin/users"
          },
          {
            title: "Messaging",
            copy: "Internal inbox that mirrors creator-facing comms. Filter by persona or queue.",
            to: "/admin/messaging"
          },
          {
            title: "Finance",
            copy: "Payment batches, invoices, and reconciliation tasks awaiting review.",
            to: "/admin/finance"
          },
          {
            title: "Settings",
            copy: "Access control, integrations, outbound comms, and admin notes.",
            to: "/admin/settings"
          }
        ].map((panel) => (
          <Link
            key={panel.title}
            to={panel.to}
            className="rounded-3xl border border-brand-black/10 bg-brand-linen/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:bg-brand-white"
          >
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              {panel.title}
            </p>
            <p className="mt-2 text-sm text-brand-black/70">{panel.copy}</p>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}

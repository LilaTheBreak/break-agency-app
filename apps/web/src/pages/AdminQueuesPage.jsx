import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";

const TASKS = [
  { title: "Finalize brand brief", due: "Today · 4:00pm", assignee: "Mo Al Ghazi" },
  { title: "Review new creator profile", due: "Tomorrow · 10:00am", assignee: "Lila Prasad" },
  { title: "Approve finance reconciliation", due: "Friday · 1:00pm", assignee: "Finance Bot" }
];

const LATEST = [
  { action: "brand@sohohouse.com submitted the Q2 intake form.", time: "5m ago" },
  { action: "creator@breaktalent.com completed onboarding.", time: "38m ago" },
  { action: "Contracts for 'Residence Series' moved to legal review.", time: "1h ago" }
];

export function AdminQueuesPage() {
  return (
    <DashboardShell
      title="Queues"
      subtitle="See what needs attention. Triage tasks, watch recent activity, and unblock teams."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Tasks due</p>
          <ul className="mt-4 space-y-3 text-left text-sm text-brand-black/80">
            {TASKS.map((task) => (
              <li
                key={task.title}
                className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3"
              >
                <p className="font-semibold text-brand-black">{task.title}</p>
                <p className="text-xs text-brand-black/60">{task.due}</p>
                <Badge tone="neutral">{task.assignee}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Latest actions</p>
          <ul className="mt-4 space-y-3 text-left text-sm text-brand-black/80">
            {LATEST.map((item) => (
              <li
                key={item.action}
                className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3"
              >
                <p>{item.action}</p>
                <p className="text-xs text-brand-black/60">{item.time}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </DashboardShell>
  );
}

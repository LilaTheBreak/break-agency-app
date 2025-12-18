import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { CrmMetaRulePanel } from "../components/CrmMetaRuleHelper.jsx";

export function AdminCrmSettingsPage({ session }) {
  return (
    <DashboardShell
      title="CRM Settings"
      subtitle="Modelling principles and system configuration"
      navLinks={ADMIN_NAV_LINKS}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">System</p>
            <h2 className="font-display text-3xl uppercase text-brand-black">CRM Principles</h2>
            <p className="mt-2 text-sm text-brand-black/60">
              Guidelines for maintaining a clean, scalable CRM structure
            </p>
          </div>
        </section>

        <CrmMetaRulePanel />

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Best Practices</p>
            <h3 className="font-display text-xl uppercase text-brand-black">When to Create Objects</h3>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                Create a Contact when...
              </p>
              <ul className="mt-2 space-y-1 text-sm text-brand-black/70">
                <li>• You have a person's name and role</li>
                <li>• You'll interact with them more than once</li>
                <li>• They're associated with a brand or deal</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                Create a Brand when...
              </p>
              <ul className="mt-2 space-y-1 text-sm text-brand-black/70">
                <li>• You're tracking a company or organization</li>
                <li>• Multiple contacts work there</li>
                <li>• You're pursuing or managing partnerships</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                Create a Campaign/Event when...
              </p>
              <ul className="mt-2 space-y-1 text-sm text-brand-black/70">
                <li>• It has a specific date or timeframe</li>
                <li>• Multiple people or brands are involved</li>
                <li>• You'll track milestones or deliverables</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
                Create a Deal/Contract when...
              </p>
              <ul className="mt-2 space-y-1 text-sm text-brand-black/70">
                <li>• There's a commercial value attached</li>
                <li>• It has terms, dates, or renewal cycles</li>
                <li>• You need to track status and progress</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Guardrails</p>
            <h3 className="font-display text-xl uppercase text-brand-black">What This Rule Does NOT Do</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-brand-black/10 bg-brand-linen/30 p-3">
              <span className="text-lg">🚫</span>
              <div>
                <p className="text-sm font-semibold text-brand-black">No blocking</p>
                <p className="text-xs text-brand-black/60">
                  You can always proceed without following the rule
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-brand-black/10 bg-brand-linen/30 p-3">
              <span className="text-lg">🚫</span>
              <div>
                <p className="text-sm font-semibold text-brand-black">No enforcement</p>
                <p className="text-xs text-brand-black/60">
                  This is guidance, not validation or hard rules
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-brand-black/10 bg-brand-linen/30 p-3">
              <span className="text-lg">🚫</span>
              <div>
                <p className="text-sm font-semibold text-brand-black">No AI auto-classification</p>
                <p className="text-xs text-brand-black/60">
                  The system won't automatically convert your content (yet)
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-brand-black/50">
            This should feel like wisdom, not restriction. The goal is to help you make better decisions,
            not to police your workflow.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}

export default AdminCrmSettingsPage;

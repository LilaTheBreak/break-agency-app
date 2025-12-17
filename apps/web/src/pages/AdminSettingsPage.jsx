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
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Access control</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Manage who can reach the console and what they can touch.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Default role</span>
              <select className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none">
                <option>Admin</option>
                <option>Manager</option>
                <option>Contributor</option>
                <option>Viewer</option>
              </select>
              <p className="text-xs text-brand-black/60">Used for new invites unless overridden.</p>
            </label>
            <label className="block space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Single sign-on</span>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-red" />
                <span className="text-sm text-brand-black/80">Require SSO for all users</span>
              </div>
              <p className="text-xs text-brand-black/60">Enforces IdP login and disables password auth.</p>
            </label>
            <label className="block space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">MFA</span>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-red" />
                <span className="text-sm text-brand-black/80">Enforce MFA on next login</span>
              </div>
              <p className="text-xs text-brand-black/60">Applies to every active user.</p>
            </label>
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Invite link</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  readOnly
                  value="https://break.agency/invite/admin-team"
                  className="w-full min-w-[220px] flex-1 rounded-xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black/70"
                />
                <button className="rounded-xl border border-brand-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
                  Copy
                </button>
                <button className="rounded-xl border border-brand-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
                  Regenerate
                </button>
              </div>
              <p className="mt-2 text-xs text-brand-black/60">Link expires after 14 days.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Integrations</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Connect tools that keep your workflows in sync.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[
              { name: "Slack", status: "Connected to #ops-control-room" },
              { name: "Notion", status: "Connected to Runbooks workspace" },
              { name: "Google Drive", status: "Not connected" }
            ].map((integration) => (
              <div key={integration.name} className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-black">{integration.name}</span>
                  <button className="rounded-xl border border-brand-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
                    {integration.status === "Not connected" ? "Connect" : "Disconnect"}
                  </button>
                </div>
                <p className="text-xs text-brand-black/60">{integration.status}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Webhook URL</span>
              <input
                type="url"
                defaultValue="https://hooks.break.agency/admin-events"
                className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
              />
              <p className="text-xs text-brand-black/60">Receives user and audit events.</p>
            </label>
            <label className="block space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">API key</span>
              <div className="flex flex-wrap gap-2">
                <input
                  readOnly
                  value="sk_live_••••••••••••"
                  className="w-full min-w-[220px] flex-1 rounded-xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black/70"
                />
                <button className="rounded-xl border border-brand-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
                  Reveal
                </button>
                <button className="rounded-xl border border-brand-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
                  Rotate
                </button>
              </div>
              <p className="text-xs text-brand-black/60">Scoped to admin operations only.</p>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Notifications</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Decide how admins and managers get alerted.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Channels</span>
              {["Email", "SMS", "Push", "Slack"].map((channel) => (
                <label key={channel} className="flex items-center gap-3 text-sm text-brand-black/80">
                  <input type="checkbox" defaultChecked={channel !== "SMS"} className="h-4 w-4 accent-brand-red" />
                  {channel}
                </label>
              ))}
            </div>
            <div className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Digest frequency</span>
              <select
                defaultValue="Daily"
                className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
              >
                <option>Hourly</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
              <p className="text-xs text-brand-black/60">Includes approvals, incidents, and SLA risk.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="flex items-center gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/80">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-red" />
              Notify me when approvals wait more than 2 hours
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/80">
              <input type="checkbox" className="h-4 w-4 accent-brand-red" />
              Notify me on payment failures
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="rounded-xl border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
              Save changes
            </button>
            <button className="rounded-xl border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5">
              Reset
            </button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

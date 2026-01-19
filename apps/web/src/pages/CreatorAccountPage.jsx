import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorAccountPage({ session }) {
  return (
    <DashboardShell
      title="Account Settings"
      subtitle="Manage your profile and account preferences"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Account Information</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Update your account settings and personal information here.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Email</p>
              <p className="mt-2 font-semibold text-brand-black">{session?.user?.email}</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Role</p>
              <p className="mt-2 font-semibold text-brand-black capitalize">{session?.user?.role}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Preferences</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Customize your account preferences and notifications.
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-brand-linen/40 p-4">
              <div>
                <p className="font-medium text-brand-black">Email Notifications</p>
                <p className="text-sm text-brand-black/60">Receive updates about campaigns and opportunities</p>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5" />
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

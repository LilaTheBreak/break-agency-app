import React, { useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export function CreatorAccountPage({ session }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    opportunityAlerts: true,
    paymentNotifications: true,
    weeklyDigest: false,
    directMessagesOnly: false
  });

  const [profileSettings, setProfileSettings] = useState({
    displayName: user?.name || "",
    bio: "",
    timezone: "UTC",
    preferredPlatforms: []
  });

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProfileChange = (key, value) => {
    setProfileSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/talent/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });
      if (response.ok) {
        toast.success("Preferences saved successfully!");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Error saving preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/talent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileSettings)
      });
      if (response.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardShell
      title="Account Settings"
      subtitle="Manage your profile and account preferences"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        {/* Account Information */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Account Information</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Your account details and verification status.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Email Address</p>
              <p className="mt-2 font-semibold text-brand-black">{session?.user?.email}</p>
              <p className="mt-1 text-xs text-green-600">✓ Verified</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Account Role</p>
              <p className="mt-2 font-semibold text-brand-black capitalize">{session?.user?.role}</p>
              <p className="mt-1 text-xs text-brand-black/50">Access Level: Creator</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Account Status</p>
              <p className="mt-2 font-semibold text-brand-black">Active</p>
              <p className="mt-1 text-xs text-green-600">✓ In Good Standing</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Member Since</p>
              <p className="mt-2 font-semibold text-brand-black">January 2024</p>
              <p className="mt-1 text-xs text-brand-black/50">1 year of activity</p>
            </div>
          </div>
        </section>

        {/* Profile Settings */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Profile Settings</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Customize your public profile and professional information.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-black">Display Name</label>
              <input
                type="text"
                value={profileSettings.displayName}
                onChange={(e) => handleProfileChange("displayName", e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm placeholder-brand-black/40 focus:border-brand-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black">Bio</label>
              <textarea
                value={profileSettings.bio}
                onChange={(e) => handleProfileChange("bio", e.target.value)}
                placeholder="Tell brands about yourself..."
                rows="4"
                className="mt-2 w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm placeholder-brand-black/40 focus:border-brand-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black">Timezone</label>
              <select
                value={profileSettings.timezone}
                onChange={(e) => handleProfileChange("timezone", e.target.value)}
                className="mt-2 w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="CST">CST (Central Standard Time)</option>
                <option value="MST">MST (Mountain Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="GMT">GMT (Greenwich Mean Time)</option>
                <option value="CET">CET (Central European Time)</option>
                <option value="IST">IST (Indian Standard Time)</option>
                <option value="AEST">AEST (Australian Eastern Standard Time)</option>
              </select>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="mt-4 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-red/90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Notification Preferences</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Control how and when you receive notifications from The Break.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates about all activities" },
              { key: "campaignUpdates", label: "Campaign Updates", desc: "Get notified when campaigns are assigned or updated" },
              { key: "opportunityAlerts", label: "Opportunity Alerts", desc: "Be notified about new opportunities matching your profile" },
              { key: "paymentNotifications", label: "Payment Notifications", desc: "Receive alerts about invoices and payouts" },
              { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of your activity each week" },
              { key: "directMessagesOnly", label: "Direct Messages Only", desc: "Only receive notifications for direct brand messages" }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-brand-linen/40 p-4">
                <div>
                  <p className="font-medium text-brand-black">{label}</p>
                  <p className="text-xs text-brand-black/60">{desc}</p>
                </div>
                <button
                  onClick={() => handlePreferenceChange(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    preferences[key] ? "bg-brand-red" : "bg-brand-black/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      preferences[key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="mt-4 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-red/90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Notification Preferences"}
            </button>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Security & Privacy</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Manage your account security and data privacy settings.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-brand-black">Change Password</p>
                  <p className="text-xs text-brand-black/60">Update your account password regularly for security</p>
                </div>
                <button className="rounded-lg border border-brand-black/20 px-3 py-2 text-xs font-medium text-brand-black hover:bg-brand-black/5">
                  Change Password
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-brand-black">Two-Factor Authentication</p>
                  <p className="text-xs text-brand-black/60">Add an extra layer of security to your account</p>
                </div>
                <button className="rounded-lg border border-brand-black/20 px-3 py-2 text-xs font-medium text-brand-black hover:bg-brand-black/5">
                  Enable 2FA
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-brand-black">Active Sessions</p>
                  <p className="text-xs text-brand-black/60">1 active session • Last login: Today at 2:30 PM</p>
                </div>
                <button className="rounded-lg border border-brand-black/20 px-3 py-2 text-xs font-medium text-brand-black hover:bg-brand-black/5">
                  View All
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Billing & Payments */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Billing & Payments</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Manage your payment methods and billing information.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Payment Methods</p>
              <p className="mt-1 text-xs text-brand-black/60">Bank account and payment preferences for payouts</p>
              <button className="mt-3 rounded-lg bg-brand-red px-3 py-2 text-xs font-medium text-white hover:bg-brand-red/90">
                Add Payment Method
              </button>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Invoicing</p>
              <p className="mt-1 text-xs text-brand-black/60">Download invoices and payment receipts</p>
              <button className="mt-3 rounded-lg border border-brand-black/20 px-3 py-2 text-xs font-medium text-brand-black hover:bg-brand-black/5">
                View Invoices
              </button>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Tax Information</p>
              <p className="mt-1 text-xs text-brand-black/60">Add W-9/Tax ID for payments</p>
              <button className="mt-3 rounded-lg border border-brand-black/20 px-3 py-2 text-xs font-medium text-brand-black hover:bg-brand-black/5">
                Update Tax Info
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-brand-black">Danger Zone</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Irreversible account actions. Proceed with caution.
          </p>
          <div className="mt-6 space-y-4">
            <button className="w-full rounded-lg border-2 border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100">
              Deactivate Account
            </button>
            <button className="w-full rounded-lg border-2 border-red-600 bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700">
              Delete Account Permanently
            </button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

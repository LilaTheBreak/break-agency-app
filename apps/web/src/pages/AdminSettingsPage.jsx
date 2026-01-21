import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";

export function AdminSettingsPage() {
  const [integrationStatuses, setIntegrationStatuses] = useState({
    Gmail: false,
    "Google Calendar": false,
    Slack: false,
    Notion: false,
    "Google Drive": false
  });
  const [loading, setLoading] = useState({});

  useEffect(() => {
    // Check Gmail connection status
    apiFetch("/api/gmail/auth/status")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.connected) {
          setIntegrationStatuses((prev) => ({ ...prev, Gmail: true }));
        }
      })
      .catch((error) => {
        console.error("[SETTINGS] Failed to check Gmail status:", error);
      });

    // Check Slack status
    apiFetch("/api/integrations/slack/status")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.connected) {
          setIntegrationStatuses((prev) => ({ ...prev, Slack: true }));
        }
      })
      .catch(() => {
        // Silently fail if integration disabled
      });

    // Check Notion status
    apiFetch("/api/integrations/notion/status")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.connected) {
          setIntegrationStatuses((prev) => ({ ...prev, Notion: true }));
        }
      })
      .catch(() => {
        // Silently fail if integration disabled
      });

    // Check Google Drive status
    apiFetch("/api/integrations/google-drive/status")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.connected) {
          setIntegrationStatuses((prev) => ({ ...prev, "Google Drive": true }));
        }
      })
      .catch(() => {
        // Silently fail if integration disabled
      });
  }, []);

  const handleConnect = async (serviceName) => {
    console.log("[CONNECT] Gmail connect clicked - handler executing");
    setLoading((prev) => ({ ...prev, [serviceName]: true }));
    
    try {
      if (serviceName === "Gmail") {
        console.log("[CONNECT] Fetching Gmail OAuth URL from /api/gmail/auth/url");
        const response = await apiFetch("/api/gmail/auth/url");
        const data = await response.json();
        console.log("[CONNECT] Gmail OAuth response:", data);
        if (data && data.url) {
          console.log("[CONNECT] Redirecting to Google OAuth:", data.url);
          window.location.assign(data.url);
          return; // Don't reset loading state since we're redirecting
        } else {
          console.error("[CONNECT] No URL in response:", data);
          toast.error("Failed to get Gmail OAuth URL");
        }
      } else if (serviceName === "Google Calendar") {
        // Google Calendar uses the same OAuth flow as login with calendar scopes
        console.log("[CONNECT] Fetching Google Calendar OAuth URL from /api/auth/google/url");
        const response = await apiFetch("/api/auth/google/url");
        const data = await response.json();
        console.log("[CONNECT] Google Calendar OAuth response:", data);
        if (data && data.url) {
          console.log("[CONNECT] Redirecting to Google OAuth:", data.url);
          window.location.assign(data.url);
          return; // Don't reset loading state since we're redirecting
        } else {
          console.error("[CONNECT] No URL in response:", data);
          toast.error("Failed to get Google Calendar OAuth URL");
        }
      } else if (serviceName === "Slack") {
        const webhookUrl = prompt("Enter your Slack webhook URL:");
        if (!webhookUrl) return;
        
        const response = await apiFetch("/api/integrations/slack/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl })
        });
        
        const result = await response.json();
        if (result.success) {
          setIntegrationStatuses((prev) => ({ ...prev, Slack: true }));
          toast.success("Slack connected successfully!");
        } else {
          toast.error(`Failed to connect Slack: ${result.error || result.message}`);
        }
      } else if (serviceName === "Notion") {
        const accessToken = prompt("Enter your Notion integration token:");
        if (!accessToken) return;
        
        const workspaceName = prompt("Enter workspace name (optional):");
        
        const response = await apiFetch("/api/integrations/notion/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            accessToken,
            workspaceName: workspaceName || undefined
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setIntegrationStatuses((prev) => ({ ...prev, Notion: true }));
          toast.success("Notion connected successfully!");
        } else {
          toast.error(`Failed to connect Notion: ${result.error || result.message}`);
        }
      } else if (serviceName === "Google Drive") {
        const accessToken = prompt("Enter your Google Drive access token:");
        if (!accessToken) return;
        
        const refreshToken = prompt("Enter refresh token (optional):");
        
        const response = await apiFetch("/api/integrations/google-drive/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            accessToken,
            refreshToken: refreshToken || undefined
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setIntegrationStatuses((prev) => ({ ...prev, "Google Drive": true }));
          toast.success("Google Drive connected successfully!");
        } else {
          toast.error(`Failed to connect Google Drive: ${result.error || result.message}`);
        }
      }
    } catch (error) {
      console.error(`Failed to connect ${serviceName}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to connect ${serviceName}`;
      toast.error(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, [serviceName]: false }));
    }
  };

  const handleDisconnect = async (serviceName) => {
    if (!confirm(`Are you sure you want to disconnect ${serviceName}?`)) {
      return;
    }

    setLoading((prev) => ({ ...prev, [serviceName]: true }));
    
    try {
      if (serviceName === "Gmail") {
        const response = await apiFetch("/api/gmail/auth/disconnect", { method: "POST" });
        const result = await response.json();
        console.log("[DISCONNECT] Gmail disconnected:", result);
        setIntegrationStatuses((prev) => ({ ...prev, Gmail: false }));
      } else if (serviceName === "Slack") {
        const response = await apiFetch("/api/integrations/slack/disconnect", { method: "POST" });
        const result = await response.json();
        if (result.success) {
          setIntegrationStatuses((prev) => ({ ...prev, Slack: false }));
        }
      } else if (serviceName === "Notion") {
        const response = await apiFetch("/api/integrations/notion/disconnect", { method: "POST" });
        const result = await response.json();
        if (result.success) {
          setIntegrationStatuses((prev) => ({ ...prev, Notion: false }));
        }
      } else if (serviceName === "Google Drive") {
        const response = await apiFetch("/api/integrations/google-drive/disconnect", { method: "POST" });
        const result = await response.json();
        if (result.success) {
          setIntegrationStatuses((prev) => ({ ...prev, "Google Drive": false }));
        }
      }
    } catch (error) {
      console.error(`[DISCONNECT] Failed to disconnect ${serviceName}:`, error);
      alert(`Failed to disconnect ${serviceName}. Please try again.`);
    } finally {
      setLoading((prev) => ({ ...prev, [serviceName]: false }));
    }
  };

  return (
    <DashboardShell
      title="Settings"
      subtitle="Configure roles, integrations, and outbound communications."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="space-y-4">
        <div className="section-wrapper elevation-1 p-5 transition-elevation">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Access control</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Manage who can reach the console and what they can touch.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="card space-y-2 p-4 transition-elevation">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Default role</span>
              <select className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none">
                <option>Admin</option>
                <option>Manager</option>
                <option>Contributor</option>
                <option>Viewer</option>
              </select>
              <p className="text-xs text-brand-black/60">Used for new invites unless overridden.</p>
            </label>
            <label className="card space-y-2 p-4 transition-elevation">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Single sign-on</span>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-red" />
                <span className="text-sm text-brand-black/80">Require SSO for all users</span>
              </div>
              <p className="text-xs text-brand-black/60">Enforces IdP login and disables password auth.</p>
            </label>
            <label className="card space-y-2 p-4 transition-elevation">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">MFA</span>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-red" />
                <span className="text-sm text-brand-black/80">Enforce MFA on next login</span>
              </div>
              <p className="text-xs text-brand-black/60">Applies to every active user.</p>
            </label>
            <div className="card p-4 transition-elevation">
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

        <div className="section-wrapper elevation-1 p-5 transition-elevation">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Integrations</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Connect tools that keep your workflows in sync.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[
              { name: "Gmail", defaultStatus: "Not connected", available: true },
              { name: "Google Calendar", defaultStatus: "Not connected", available: true },
              { name: "Slack", defaultStatus: "Not connected", available: true },
              { name: "Notion", defaultStatus: "Not connected", available: true },
              { name: "Google Drive", defaultStatus: "Not connected", available: true }
            ].map((integration) => {
              const isConnected = integrationStatuses[integration.name];
              const isLoading = loading[integration.name];
              const isAvailable = integration.available;
              const displayStatus = isConnected 
                ? "Connected"
                : integration.defaultStatus;

              return (
                <div key={integration.name} className={`card space-y-2 p-4 transition-elevation ${!isAvailable ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-black">{integration.name}</span>
                      {!isAvailable && (
                        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-brand-black/50 bg-brand-black/5 px-2 py-0.5 rounded-full">Coming soon</span>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAvailable) {
                          alert(`${integration.name} integration is not yet available. This feature is coming soon.`);
                          return;
                        }
                        isConnected ? handleDisconnect(integration.name) : handleConnect(integration.name);
                      }}
                      disabled={isLoading || !isAvailable}
                      className="rounded-xl border border-brand-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "..." : (isConnected ? "Disconnect" : (isAvailable ? "Connect" : "Coming soon"))}
                    </button>
                  </div>
                  <p className="text-xs text-brand-black/60">{displayStatus}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="card space-y-2 p-4 transition-elevation">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Webhook URL</span>
              <input
                type="url"
                defaultValue="https://hooks.break.agency/admin-events"
                className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
              />
              <p className="text-xs text-brand-black/60">Receives user and audit events.</p>
            </label>
            <label className="card space-y-2 p-4 transition-elevation">
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

        <div className="section-wrapper elevation-1 p-5 transition-elevation">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Notifications</p>
          <p className="mt-2 text-sm text-brand-black/70">
            Decide how admins and managers get alerted.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card space-y-2 p-4 transition-elevation">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-brand-black/60">Channels</span>
              {["Email", "SMS", "Push", "Slack"].map((channel) => (
                <label key={channel} className="flex items-center gap-3 text-sm text-brand-black/80">
                  <input type="checkbox" defaultChecked={channel !== "SMS"} className="h-4 w-4 accent-brand-red" />
                  {channel}
                </label>
              ))}
            </div>
            <div className="card space-y-2 p-4 transition-elevation">
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
            <label className="card px-4 py-3 text-sm text-brand-black/80 transition-elevation flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-red" />
              Notify me when approvals wait more than 2 hours
            </label>
            <label className="card px-4 py-3 text-sm text-brand-black/80 transition-elevation flex items-center gap-3">
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

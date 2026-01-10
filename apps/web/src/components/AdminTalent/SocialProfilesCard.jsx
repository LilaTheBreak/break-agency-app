/**
 * Social Profiles Card Component
 * 
 * Production-grade social profile connection interface
 * Supports:
 * - Manual URL-based linking
 * - OAuth platform login
 * - Real-time sync status display
 * - Platform-native UI
 */

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader,
  Link2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import PlatformIcon, { platformNames, platformColors } from "./PlatformIcon";

interface SocialConnection {
  id: string;
  platform: string;
  handle: string;
  profileUrl?: string;
  connected: boolean;
  connectionType: "MANUAL" | "OAUTH";
  syncStatus: "PENDING" | "SYNCING" | "READY" | "ERROR";
  syncError?: string;
  lastSyncedAt?: string;
  createdAt: string;
}

interface SocialProfilesCardProps {
  talentId: string;
  onConnectionsChange?: () => void;
}

export function SocialProfilesCard({ talentId, onConnectionsChange }: SocialProfilesCardProps) {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: "INSTAGRAM",
    handle: "",
    profileUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePlatforms = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER", "LINKEDIN"];

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [talentId]);

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/admin/talent/${talentId}/social-connections`);
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      setLoading(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.handle.trim()) {
      toast.error("Handle is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/socials/connect-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentId,
          platform: formData.platform,
          handle: formData.handle,
          profileUrl: formData.profileUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to connect profile");
      }

      toast.success(
        `${platformNames[formData.platform]} profile connected. Syncing data...`
      );
      setFormData({ platform: "INSTAGRAM", handle: "", profileUrl: "" });
      setShowAddForm(false);
      await fetchConnections();
      onConnectionsChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (
      !window.confirm("Remove this social connection? Data will be cleared.")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/socials/${connectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete connection");
      }

      toast.success("Connection removed");
      await fetchConnections();
      onConnectionsChange?.();
    } catch (error) {
      toast.error("Failed to remove connection");
    }
  };

  const handleRefreshSync = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/admin/socials/${connectionId}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to trigger sync");
      }

      toast.success("Sync triggered. Refreshing data...");
      await fetchConnections();
    } catch (error) {
      toast.error("Failed to refresh sync");
    }
  };

  const getSyncStatusDisplay = (connection: SocialConnection) => {
    switch (connection.syncStatus) {
      case "PENDING":
        return {
          icon: <Clock className="w-4 h-4" />,
          label: "Pending",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        };
      case "SYNCING":
        return {
          icon: <Loader className="w-4 h-4 animate-spin" />,
          label: "Syncing",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "READY":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: "Connected",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "ERROR":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Error",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
    }
  };

  const colors = platformColors[formData.platform];

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-gradient-to-br from-brand-linen/50 to-brand-white/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-brand-black/10 bg-brand-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-brand-black uppercase tracking-[0.15em]">
              Social Profiles
            </h3>
            <p className="text-xs text-brand-black/60 mt-1">
              {connections.length === 0
                ? "No connected profiles"
                : `${connections.length} profile${connections.length === 1 ? "" : "s"} connected`}
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-red text-white text-xs font-semibold uppercase tracking-[0.1em] hover:bg-brand-red/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Connect Profile
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-brand-black/5">
        {/* Connections List */}
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <Loader className="w-5 h-5 animate-spin text-brand-black/40" />
          </div>
        ) : connections.length === 0 && !showAddForm ? (
          <div className="p-6">
            <div className="text-center">
              <Link2 className="w-12 h-12 mx-auto mb-3 text-brand-black/20" />
              <p className="text-sm text-brand-black/60 mb-4">
                No social profiles connected yet
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-red text-brand-red text-xs font-semibold uppercase tracking-[0.1em] hover:bg-brand-red hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {connections.map((connection) => {
              const statusDisplay = getSyncStatusDisplay(connection);
              const colors = platformColors[connection.platform];

              return (
                <div
                  key={connection.id}
                  className="rounded-lg border border-brand-black/10 bg-brand-white p-4 hover:border-brand-black/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Platform + Handle */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <PlatformIcon platform={connection.platform} size="md" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-brand-black/60 uppercase tracking-[0.1em]">
                          {platformNames[connection.platform]}
                        </h4>
                        <p className="text-sm font-medium text-brand-black truncate">
                          @{connection.handle}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}
                          >
                            {statusDisplay.icon}
                            {statusDisplay.label}
                          </div>
                          {connection.connectionType === "OAUTH" && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium">
                              OAuth
                            </span>
                          )}
                          {connection.connectionType === "MANUAL" && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                              Manual
                            </span>
                          )}
                        </div>

                        {/* Sync Error */}
                        {connection.syncStatus === "ERROR" && connection.syncError && (
                          <p className="text-xs text-red-600 mt-2">
                            Error: {connection.syncError}
                          </p>
                        )}

                        {/* Last Synced Time */}
                        {connection.lastSyncedAt && (
                          <p className="text-xs text-brand-black/40 mt-2">
                            Last synced:{" "}
                            {new Date(connection.lastSyncedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {connection.profileUrl && (
                        <a
                          href={connection.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-brand-black/5 text-brand-black/40 hover:text-brand-black transition-colors"
                          title="View profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleRefreshSync(connection.id)}
                        disabled={connection.syncStatus === "SYNCING"}
                        className="p-2 rounded-lg hover:bg-brand-black/5 text-brand-black/40 hover:text-brand-black disabled:opacity-50 transition-colors"
                        title="Refresh data"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-brand-black/40 hover:text-brand-red transition-colors"
                        title="Remove connection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Connection Form */}
        {showAddForm && (
          <form onSubmit={handleAddConnection} className="p-4 space-y-4 border-t border-brand-black/5">
            <div>
              <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-[0.1em] mb-2">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50"
              >
                {availablePlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platformNames[platform]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-[0.1em] mb-2">
                Handle or @Username
              </label>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) =>
                  setFormData({ ...formData, handle: e.target.value })
                }
                placeholder="@username (without @)"
                className="w-full px-3 py-2 rounded-lg border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50"
              />
              <p className="text-xs text-brand-black/40 mt-1">
                Enter the handle without the @ symbol
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-black/60 uppercase tracking-[0.1em] mb-2">
                Profile URL (Optional)
              </label>
              <input
                type="url"
                value={formData.profileUrl}
                onChange={(e) =>
                  setFormData({ ...formData, profileUrl: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-brand-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50"
              />
              <p className="text-xs text-brand-black/40 mt-1">
                Direct link to their profile (helps verify)
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-xs text-brand-black/60">
                ℹ️ <strong>Manual linking</strong> allows immediate connection. Data will sync in the background.
              </p>
              <p className="text-xs text-brand-black/60">
                💡 For real-time data, connect via <strong>OAuth</strong> in Talent Account settings.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg bg-brand-red text-white text-xs font-semibold uppercase tracking-[0.1em] hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Connecting..." : "Confirm & Connect"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ platform: "INSTAGRAM", handle: "", profileUrl: "" });
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-brand-black/10 text-brand-black text-xs font-semibold uppercase tracking-[0.1em] hover:bg-brand-black/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SocialProfilesCard;

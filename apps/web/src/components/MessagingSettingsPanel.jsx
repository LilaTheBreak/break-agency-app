import React, { useState } from "react";
import { Settings, Trash2, Check, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useInboxes } from "../hooks/useInboxes.js";
import toast from "react-hot-toast";

export function MessagingSettingsPanel({ isOpen, onClose }) {
  const { inboxes, defaultInbox, loading, error, setDefaultInbox, deleteInbox } = useInboxes();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (!isOpen) return null;

  const handleSetDefault = async (inboxId) => {
    try {
      await setDefaultInbox(inboxId);
    } catch (err) {
      console.error("Failed to set default:", err);
    }
  };

  const handleDeleteInbox = async (inboxId) => {
    try {
      await deleteInbox(inboxId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete inbox:", err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "syncing":
        return <Clock size={16} className="text-amber-500 animate-spin" />;
      case "idle":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "error":
        return <AlertCircle size={16} className="text-brand-red" />;
      default:
        return <Clock size={16} className="text-brand-black/50" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "syncing":
        return "Syncing...";
      case "idle":
        return "Connected";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-brand-black/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-brand-red" />
            <h2 className="font-display text-xl uppercase text-brand-black">Messaging Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-brand-black/50 hover:text-brand-black text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Connected Inboxes Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-sm uppercase text-brand-red mb-4 tracking-[0.35em]">
              Connected Inboxes
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl border border-brand-black/10 bg-brand-linen/20 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 flex gap-3">
                <AlertCircle size={16} className="text-brand-black/60 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-black/70">{error}</p>
              </div>
            ) : inboxes.length === 0 ? (
              <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-6 text-center">
                <p className="text-sm text-brand-black/70">No inboxes connected yet</p>
                <p className="text-xs text-brand-black/50 mt-2">Add your first inbox to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inboxes.map((inbox) => {
                  const isDefault = defaultInbox?.id === inbox.id;
                  const isDeleting = confirmDeleteId === inbox.id;

                  return (
                    <div
                      key={inbox.id}
                      className={`rounded-2xl border-2 p-4 ${
                        isDefault
                          ? "border-brand-red/50 bg-brand-red/5"
                          : "border-brand-black/10 bg-brand-white hover:border-brand-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Inbox Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-brand-black truncate">
                              {inbox.emailAddress}
                            </h4>
                            {isDefault && (
                              <span className="inline-block px-2 py-1 rounded bg-brand-red/20 text-brand-red text-xs font-semibold whitespace-nowrap">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="capitalize text-xs font-semibold text-brand-black/70 px-2 py-1 bg-brand-black/5 rounded">
                              {inbox.provider}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-brand-black/60">
                              {getStatusIcon(inbox.syncStatus)}
                              <span>{getStatusLabel(inbox.syncStatus)}</span>
                            </div>
                          </div>

                          <p className="text-xs text-brand-black/50 mt-2">
                            Last synced: {formatDate(inbox.lastSyncedAt)}
                          </p>

                          {inbox.lastError && (
                            <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {inbox.lastError}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isDefault && (
                            <button
                              onClick={() => handleSetDefault(inbox.id)}
                              className="p-2 rounded-lg hover:bg-brand-black/5 text-brand-black/60 hover:text-brand-black transition-colors"
                              title="Set as default"
                            >
                              <Check size={18} />
                            </button>
                          )}

                          {inboxes.length > 1 && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setConfirmDeleteId(isDeleting ? null : inbox.id)
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  isDeleting
                                    ? "bg-brand-red/10 text-brand-red"
                                    : "text-brand-black/60 hover:bg-brand-black/5 hover:text-brand-black"
                                }`}
                                title="Remove inbox"
                              >
                                <Trash2 size={18} />
                              </button>

                              {isDeleting && (
                                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-brand-black/10 p-3 whitespace-nowrap z-10">
                                  <p className="text-xs font-semibold mb-2">Remove this inbox?</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDeleteInbox(inbox.id)}
                                      className="px-3 py-1 rounded bg-brand-red text-white text-xs font-semibold hover:bg-brand-red/90"
                                    >
                                      Remove
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-3 py-1 rounded bg-brand-black/10 text-brand-black text-xs font-semibold hover:bg-brand-black/20"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Box */}
          {inboxes.length > 0 && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 flex gap-3">
              <AlertCircle size={16} className="text-brand-black/60 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-black/70">
                Your default inbox is used for syncing and email operations. You can switch to different inboxes from the
                main messaging view.
              </p>
            </div>
          )}

          {/* Future Integrations */}
          <div className="mt-6">
            <h3 className="font-semibold text-sm uppercase text-brand-red mb-4 tracking-[0.35em]">
              Coming Soon
            </h3>
            <div className="space-y-2">
              {["Outlook", "WhatsApp Business", "Instagram DMs"].map((provider) => (
                <div key={provider} className="rounded-2xl border border-brand-black/10 bg-brand-black/5 p-3">
                  <p className="text-sm text-brand-black/60">{provider}</p>
                  <p className="text-xs text-brand-black/40 mt-0.5">Integration coming soon</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

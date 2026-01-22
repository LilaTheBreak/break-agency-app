import React, { useState } from "react";
import { Plus, Mail, Lock, AlertCircle } from "lucide-react";
import { useInboxes } from "../hooks/useInboxes.js";
import toast from "react-hot-toast";

const PROVIDERS = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Add your Gmail inbox",
    icon: Mail,
    enabled: true,
    comingSoon: false,
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Connect your Outlook inbox",
    icon: Mail,
    enabled: false,
    comingSoon: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Manage WhatsApp conversations",
    icon: Lock,
    enabled: false,
    comingSoon: true,
  },
  {
    id: "instagram",
    name: "Instagram Direct Messages",
    description: "Connect Instagram DMs",
    icon: Lock,
    enabled: false,
    comingSoon: true,
  },
];

export function AddInboxModal({ isOpen, onClose }) {
  const { createInbox } = useInboxes();
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  if (!isOpen) return null;

  const handleSelectProvider = async (providerId) => {
    if (providerId === "gmail") {
      setLoading(true);
      try {
        const result = await createInbox(providerId, "");

        // Gmail OAuth redirect
        if (result.authUrl) {
          window.location.href = result.authUrl;
        }
      } catch (err) {
        console.error("Failed to initiate Gmail auth:", err);
      } finally {
        setLoading(false);
      }
    } else {
      toast.info(`${providerId} integration coming soon!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-brand-black/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plus size={20} className="text-brand-red" />
            <h2 className="font-display text-xl uppercase text-brand-black">Add Inbox</h2>
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
          <p className="text-sm text-brand-black/70 mb-6">
            Choose a platform to connect your inbox. You can add multiple inboxes and manage them from settings.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              const isDisabled = !provider.enabled;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  disabled={isDisabled || loading}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                    isDisabled
                      ? "border-brand-black/10 bg-brand-black/2 opacity-60 cursor-not-allowed"
                      : "border-brand-black/20 bg-brand-white hover:border-brand-red hover:bg-brand-red/5 active:scale-95"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${
                        isDisabled
                          ? "bg-brand-black/10 text-brand-black/50"
                          : "bg-brand-red/10 text-brand-red"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-brand-black">{provider.name}</h3>
                        {provider.comingSoon && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold text-amber-600 bg-amber-100">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-black/60 mt-1">{provider.description}</p>
                    </div>

                    {loading && provider.id === "gmail" && (
                      <div className="flex-shrink-0">
                        <svg className="animate-spin h-5 w-5 text-brand-red" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 flex gap-3">
            <AlertCircle size={18} className="text-brand-black/60 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-black/70">
              We'll securely store your connection details and sync messages automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

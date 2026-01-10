import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * TalentSocialProfilesAccordion Component
 * 
 * Collapsible section for managing social media accounts.
 * Reduces form fatigue by hiding social profiles by default.
 * Users can expand to view, add, or remove accounts.
 */
export function TalentSocialProfilesAccordion({ talent, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState("INSTAGRAM");
  const [newHandle, setNewHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const socialAccounts = talent.socialAccounts || [];

  const platforms = [
    { value: "INSTAGRAM", label: "Instagram", icon: "📷" },
    { value: "TIKTOK", label: "TikTok", icon: "🎵" },
    { value: "YOUTUBE", label: "YouTube", icon: "▶️" },
    { value: "X", label: "X (Twitter)", icon: "🐦" },
    { value: "LINKEDIN", label: "LinkedIn", icon: "💼" },
  ];

  const getPlatformLabel = (platform) => {
    return platforms.find((p) => p.value === platform)?.label || platform;
  };

  const getPlatformIcon = (platform) => {
    return platforms.find((p) => p.value === platform)?.icon || "@";
  };

  const handleAddSocial = async () => {
    if (!newHandle.trim()) {
      toast.error("Please enter a handle");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/talent/${talent.id}/socials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: newPlatform, handle: newHandle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add social profile");
      }

      toast.success(`${getPlatformLabel(newPlatform)} added successfully`);
      setNewPlatform("INSTAGRAM");
      setNewHandle("");
      setShowAddForm(false);
      onUpdate?.();
    } catch (err) {
      toast.error(err.message || "Failed to add social profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSocial = async (socialId) => {
    if (!window.confirm("Remove this social profile?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/talent/socials/${socialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove social profile");
      }

      toast.success("Social profile removed");
      onUpdate?.();
    } catch (err) {
      toast.error(err.message || "Failed to remove social profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
            Social Profiles
          </span>
          {socialAccounts.length > 0 && (
            <span className="inline-block px-2 py-1 rounded-full bg-brand-red/10 text-xs text-brand-red font-semibold">
              {socialAccounts.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-brand-black/40 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <>
          <div className="border-t border-brand-black/10 px-4 py-3">
            {/* Social Accounts List */}
            {socialAccounts.length > 0 ? (
              <div className="space-y-2 mb-4">
                {socialAccounts.map((social) => (
                  <div
                    key={social.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-brand-white border border-brand-black/5 hover:border-brand-black/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{getPlatformIcon(social.platform)}</span>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">
                          {getPlatformLabel(social.platform)}
                        </p>
                        <p className="text-sm font-medium text-brand-black truncate">
                          @{social.handle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`https://${social.platform.toLowerCase()}.com/${social.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-brand-black/40 hover:text-brand-black transition-colors"
                        title="View profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteSocial(social.id)}
                        disabled={isLoading}
                        className="p-2 text-brand-black/40 hover:text-brand-red transition-colors disabled:opacity-50"
                        title="Remove profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-black/40 mb-4 italic">
                No social profiles added yet
              </p>
            )}

            {/* Add Social Form */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-brand-black/20 text-xs uppercase tracking-[0.2em] text-brand-black/60 hover:bg-brand-black/5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Social Profile
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-brand-white border border-brand-black/10 space-y-3">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                    Platform
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
                  >
                    {platforms.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                    Handle (without @)
                  </label>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="e.g., @yourhandle"
                    className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddSocial}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-brand-red px-3 py-2 text-xs uppercase tracking-[0.2em] text-white font-semibold hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 rounded-lg border border-brand-black/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-brand-black/60 hover:bg-brand-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import { PlatformLogo } from "../PlatformLogo";
import { getErrorMessage } from "../../lib/errorHandler.js";

/**
 * TalentSocialProfilesAccordion Component
 * 
 * Collapsible section for managing social media accounts.
 * Reduces form fatigue by hiding social profiles by default.
 * Users can expand to view, add, or remove accounts.
 */
export function TalentSocialProfilesAccordion({ talent, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState("INSTAGRAM");
  const [newHandle, setNewHandle] = useState("");
  const [newFollowers, setNewFollowers] = useState("");
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
        body: JSON.stringify({ 
          platform: newPlatform, 
          handle: newHandle,
          followers: newFollowers ? parseInt(newFollowers) : null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add social profile");
      }

      toast.success(`${getPlatformLabel(newPlatform)} added successfully`);
      setNewPlatform("INSTAGRAM");
      setNewHandle("");
      setNewFollowers("");
      onUpdate?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add social profile"));
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
      toast.error(getErrorMessage(err, "Failed to remove social profile"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-red">
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

      {/* Content - Merged Form and Profiles */}
      {isOpen && (
        <div className="border-t border-brand-black/10">
          <div className="px-4 py-4 space-y-4">
            {/* Add Social Form - Always visible when expanded */}
            <div className="rounded-lg bg-brand-linen/40 border border-brand-black/10 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 font-semibold">
                {newPlatform}
              </p>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                  Platform
                </label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red appearance-none bg-no-repeat"
                  style={{
                    backgroundImage: `url("${
                      {
                        INSTAGRAM: "/logos/instagram.jpeg",
                        TIKTOK: "/logos/tiktok.avif",
                        YOUTUBE: "/logos/youtube.webp",
                        X: "🐦",
                        LINKEDIN: "/logos/linkedin.png",
                      }[newPlatform] || "📷"
                    }")`,
                    backgroundPosition: "right 8px center",
                    backgroundSize: "20px 20px",
                    paddingRight: "32px",
                  }}
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
                  Handle or Profile URL (e.g., @username or instagram.com/username)
                </label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="e.g., @yourhandle"
                  className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-2">
                  Followers (optional, auto-populated for Instagram)
                </label>
                <input
                  type="number"
                  value={newFollowers}
                  onChange={(e) => setNewFollowers(e.target.value)}
                  placeholder="e.g., 50000"
                  className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <button
                onClick={handleAddSocial}
                disabled={isLoading || !newHandle.trim()}
                className="w-full rounded-lg bg-brand-red px-3 py-2 text-xs uppercase tracking-[0.2em] text-white font-semibold hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Adding..." : "Add Social Profile"}
              </button>
            </div>

            {/* Social Accounts List */}
            {socialAccounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 font-semibold">
                  Connected Profiles
                </p>
                {socialAccounts.map((social) => (
                  <div
                    key={social.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-brand-white border border-brand-black/10 hover:border-brand-black/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg flex-shrink-0">
                        {getPlatformIcon(social.platform)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">
                          {getPlatformLabel(social.platform)}
                        </p>
                        <p className="text-sm font-medium text-brand-black truncate">
                          @{social.handle}
                        </p>
                        {social.followers && (
                          <p className="text-xs text-brand-black/50">
                            {(social.followers || 0).toLocaleString()} followers
                          </p>
                        )}
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
            )}

            {/* Empty State */}
            {socialAccounts.length === 0 && (
              <p className="text-xs text-brand-black/40 italic text-center py-2">
                No social profiles added yet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

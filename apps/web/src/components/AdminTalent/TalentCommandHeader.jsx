import React, { useState } from "react";
import { Edit2, MoreVertical, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * TalentCommandHeader Component
 * 
 * Displays the primary talent identity section with:
 * - 64px avatar
 * - Talent name and one-liner status
 * - Quick action dropdown
 * 
 * This is the "Command" layer of the 3-tier architecture:
 * Identity → Health → Workspaces
 */
export function TalentCommandHeader({ talent, onEdit, onViewAs, isLoading = false, onRefreshProfileImage }) {
  const [showActions, setShowActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!talent) return null;

  // Handle profile image refresh
  const handleRefreshProfileImage = async () => {
    if (!talent.id || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/admin/talent/${talent.id}/profile-image/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      toast.success(`Profile photo updated from ${data.data.source || 'social media'}`);
      
      // Call parent callback to refresh talent data
      if (onRefreshProfileImage) {
        await onRefreshProfileImage();
      }
    } catch (error) {
      console.error('Profile image sync error:', error);
      toast.error('Could not refresh profile photo. Try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Extract initials from name
  const getInitials = (name) => {
    return (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine status color
  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  };
  const statusColor = statusColors[talent.status] || statusColors.ACTIVE;

  // Representation type label
  const repTypeLabels = {
    EXCLUSIVE: "Exclusive",
    NON_EXCLUSIVE: "Non-Exclusive",
    FRIEND_OF_HOUSE: "Friends of House",
    UGC: "UGC",
    FOUNDER: "Founder",
  };
  const repTypeLabel = repTypeLabels[talent.representationType] || talent.representationType;

  return (
    <section className="mb-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center justify-between">
        {/* Left: Avatar + Identity */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {/* Priority: Social profile image > User avatar > Initials */}
            {talent.profileImageUrl && !imageError ? (
              <img
                src={talent.profileImageUrl}
                alt={talent.displayName || talent.name}
                className="h-16 w-16 rounded-full border-2 border-brand-black/10 object-cover"
                title={`Profile photo from ${talent.profileImageSource}`}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : talent.linkedUser?.avatarUrl ? (
              <img
                src={talent.linkedUser.avatarUrl}
                alt={talent.displayName || talent.name}
                className="h-16 w-16 rounded-full border-2 border-brand-black/10 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-black/10 bg-brand-red/10">
                <span className="text-lg font-semibold text-brand-red">
                  {getInitials(talent.displayName || talent.name)}
                </span>
              </div>
            )}
          </div>

          {/* Identity Stack */}
          <div className="min-w-0 flex-1">
            {/* Name */}
            <h1 className="font-display text-2xl uppercase text-brand-black">
              {talent.displayName || talent.name}
            </h1>

            {/* Status + Rep Type */}
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-block h-2 w-2 rounded-full ${statusColor.split(" ")[0]}`} />
              <span className="text-xs uppercase tracking-[0.2em] text-brand-black/60">
                {talent.status || "Active"}
              </span>
              <span className="text-xs text-brand-black/40">•</span>
              <span className="text-xs font-semibold text-brand-red">{repTypeLabel}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/60 transition-colors hover:bg-brand-black/5 disabled:opacity-50"
            title="Edit talent profile"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              disabled={isLoading}
              className="flex items-center justify-center rounded-full border border-brand-black/20 p-2 text-brand-black/60 transition-colors hover:bg-brand-black/5 disabled:opacity-50"
              title="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown */}
            {showActions && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-brand-black/10 bg-brand-white shadow-lg">
                <button
                  onClick={() => {
                    onViewAs();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-brand-black/70 transition-colors hover:bg-brand-black/5"
                >
                  View as Talent
                </button>
                <hr className="border-brand-black/5" />
                <button
                  onClick={() => {
                    handleRefreshProfileImage();
                    setShowActions(false);
                  }}
                  disabled={isRefreshing}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-brand-black/70 transition-colors hover:bg-brand-black/5 disabled:opacity-50"
                  title="Fetch latest profile photo from connected social accounts"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Photo'}
                </button>
                <hr className="border-brand-black/5" />
                <button
                  onClick={() => {
                    toast.info("Archive feature coming soon");
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-brand-black/70 transition-colors hover:bg-brand-black/5"
                >
                  Archive Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

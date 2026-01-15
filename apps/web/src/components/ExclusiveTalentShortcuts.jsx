import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";
import { Users, Loader } from "lucide-react";

/**
 * ExclusiveTalentShortcuts
 * 
 * Visual shortcut section for exclusive talents
 * Displays circular avatars in a horizontal row for quick access
 * 
 * Features:
 * - Shows profile images or initials fallback
 * - Hover tooltip with talent name
 * - Click to navigate to Talent Management page
 * - Empty state handling
 * - Loading state
 */
export function ExclusiveTalentShortcuts() {
  const navigate = useNavigate();
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExclusiveTalents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFetch("/api/admin/talent?representationType=EXCLUSIVE&limit=20");
        
        if (!response.ok) {
          if (response.status === 403) {
            setError("Admin access required");
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error("[ExclusiveTalentShortcuts] JSON parse error:", e);
          data = { talents: [] };
        }
        
        setTalents(Array.isArray(data) ? data : (data.talents || []));
      } catch (err) {
        console.error("[ExclusiveTalentShortcuts]", err);
        setError("Failed to load exclusive talents");
      } finally {
        setLoading(false);
      }
    };

    fetchExclusiveTalents();
  }, []);

  // Helper: Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper: Get background color based on name (consistent across sessions)
  const getAvatarColor = (id) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-green-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-indigo-500",
    ];
    const charCode = id.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Render avatar item
  const AvatarItem = ({ talent }) => (
    <div
      key={talent.id}
      onClick={() => navigate(`/admin/talent/${talent.id}`)}
      className="group relative flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110"
      title={talent.name}
    >
      {/* Avatar Circle - Compact */}
      <div
        className={`
          h-12 w-12 rounded-full border border-brand-black/10 
          flex items-center justify-center text-xs font-semibold 
          text-white transition-all duration-200
          group-hover:border-brand-black/30 group-hover:shadow-md
          ${
            talent.profileImageUrl
              ? "bg-cover bg-center"
              : `${getAvatarColor(talent.id)}`
          }
        `}
        style={
          talent.profileImageUrl
            ? {
                backgroundImage: `url(${talent.profileImageUrl})`,
              }
            : {}
        }
      >
        {!talent.profileImageUrl && (
          <span className="text-[10px] font-bold">{getInitials(talent.name)}</span>
        )}
      </div>

      {/* Tooltip on Hover */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none z-10">
        {talent.name}
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <section className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-brand-black/40" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-black/50">
            Quick Switch
          </h3>
        </div>
        <div className="flex items-center justify-center py-3">
          <Loader className="h-4 w-4 animate-spin text-brand-black/40" />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-brand-black/40" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-black/50">
            Quick Switch
          </h3>
        </div>
        <p className="text-xs text-brand-black/50 mt-2">{error}</p>
      </section>
    );
  }

  // Empty state
  if (talents.length === 0) {
    return (
      <section className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-brand-black/40" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-black/50">
            Quick Switch
          </h3>
        </div>
        <p className="text-xs text-brand-black/50 mt-1">No exclusive talents yet</p>
      </section>
    );
  }

  // Render talents
  return (
    <section className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-3.5 w-3.5 text-brand-black/40" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-black/50">
          Quick Switch
        </h3>
      </div>

      {/* Horizontal scrollable avatar row */}
      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex gap-3 pb-1">
          {talents.map((talent) => (
            <AvatarItem key={talent.id} talent={talent} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ExclusiveTalentShortcuts;

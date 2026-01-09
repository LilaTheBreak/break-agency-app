import React, { useState } from "react";
import { useImpersonation } from "../context/ImpersonationContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

/**
 * ViewAsTalentButton - Allows SUPERADMIN to view a talent profile as that talent would see it
 * Only visible to SUPERADMIN users
 */
export function ViewAsTalentButton({ talentId, talentName }) {
  const { user } = useAuth();
  const { startImpersonation, isLoading } = useImpersonation();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Only show to SUPERADMIN
  const isSuperAdmin = user?.role === "SUPERADMIN";
  if (!isSuperAdmin) {
    return null;
  }

  const handleViewAsTalent = async () => {
    try {
      setError(null);
      await startImpersonation(talentId);
      // Redirect to talent dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error starting impersonation:", err);
      setError(err.message || "Failed to start impersonation");
    }
  };

  return (
    <>
      <button
        onClick={handleViewAsTalent}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-black transition hover:bg-brand-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
        title="View the platform exactly as this talent would see it"
      >
        <Eye className="h-4 w-4" />
        {isLoading ? "Starting..." : "View as Talent"}
      </button>
      {error && (
        <div className="mt-2 rounded-lg border border-brand-red/20 bg-brand-red/5 p-3">
          <p className="text-sm text-brand-red">{error}</p>
        </div>
      )}
    </>
  );
}

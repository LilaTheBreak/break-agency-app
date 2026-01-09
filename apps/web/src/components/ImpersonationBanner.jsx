import React from "react";
import { useImpersonation } from "../context/ImpersonationContext.jsx";
import { useNavigate } from "react-router-dom";

/**
 * ImpersonationBanner - Shows when a SUPERADMIN is viewing as a talent user
 * Displays at the top of the screen with a clear "Exit" button
 */
export function ImpersonationBanner() {
  const { impersonating, impersonationContext, stopImpersonation, isLoading } = useImpersonation();
  const navigate = useNavigate();

  if (!impersonating || !impersonationContext) {
    return null;
  }

  const handleExit = async () => {
    try {
      await stopImpersonation();
      // Redirect back to admin dashboard
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to exit impersonation:", error);
      alert("Failed to exit impersonation. Please try again.");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-brand-red text-white shadow-lg">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 2m6-9a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">
              You are viewing the platform as{" "}
              <span className="font-bold">{impersonationContext.talentName}</span>
            </p>
            <p className="text-xs text-white/80">{impersonationContext.talentEmail}</p>
          </div>
        </div>
        <button
          onClick={handleExit}
          disabled={isLoading}
          className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Exiting..." : "Exit View As"}
        </button>
      </div>
    </div>
  );
}

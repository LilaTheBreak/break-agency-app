import React, { useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function CreatorAgentPage({ session }) {
  const { user } = useAuth();
  const [socialsConnected, setSocialsConnected] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  useEffect(() => {
    // Check if user has connected socials
    if (user?.connectedSocials && Object.keys(user.connectedSocials).length > 0) {
      setSocialsConnected(true);
    }
  }, [user]);

  const handleApplyExclusive = async () => {
    setIsApplying(true);
    try {
      // TODO: Call API endpoint to submit exclusive talent application
      const response = await fetch("/api/talent/apply-exclusive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id })
      });
      if (response.ok) {
        setApplyMessage("✓ Application submitted! Our team will review your profile.");
      } else {
        setApplyMessage("Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error("Failed to apply:", error);
      setApplyMessage("Error submitting application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <DashboardShell
      title="AI Agent"
      subtitle="Manage your AI agent and automations"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">AI Agent Configuration</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            <span className="font-medium">For Exclusive Talent:</span> This feature is available exclusively for members of The Break's premium creator network. Set up and manage your personal AI agent for handling briefs, rate cards, and automated responses.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Agent Status</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <p className="font-semibold text-brand-black">Active</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Agent Features</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Auto-Response Templates</p>
              <p className="text-sm text-brand-black/60">Manage pre-written responses for common requests</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Rate Card Automation</p>
              <p className="text-sm text-brand-black/60">Auto-update rate cards based on performance metrics</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="font-medium text-brand-black">Brief Tracking</p>
              <p className="text-sm text-brand-black/60">AI-powered brief organization and prioritization</p>
            </div>
          </div>
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Exclusive Talent Program</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Unlock premium features and direct collaboration opportunities with The Break by joining our exclusive talent network.
          </p>
          <div className="mt-6 rounded-xl bg-brand-linen/40 p-4">
            {socialsConnected ? (
              <>
                <p className="text-sm text-brand-black/60">
                  ✓ You've connected your social profiles. You're eligible to apply for exclusive talent status.
                </p>
                <button
                  onClick={handleApplyExclusive}
                  disabled={isApplying}
                  className="mt-4 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-red/90 disabled:opacity-50"
                >
                  {isApplying ? "Submitting..." : "Apply to be an Exclusive Talent with The Break"}
                </button>
                {applyMessage && (
                  <p className="mt-3 text-xs text-brand-black/70">{applyMessage}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-brand-black/60">
                📱 Connect your social media profiles first to qualify for the exclusive talent program.
              </p>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

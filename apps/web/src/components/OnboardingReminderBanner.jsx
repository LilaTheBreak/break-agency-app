import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getOnboardingPathForRole } from "../lib/onboardingState.js";

export function OnboardingReminderBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show on onboarding pages
  if (location.pathname.includes("/onboarding")) {
    return null;
  }

  // Don't show if dismissed (session-only)
  if (dismissed) {
    return null;
  }

  // Show banner when: user is approved BUT onboarding is not completed
  const shouldShow = user?.isApproved === true && user?.onboardingComplete !== true;

  if (!shouldShow) {
    return null;
  }

  const handleComplete = () => {
    const onboardingPath = getOnboardingPathForRole(user?.role);
    navigate(onboardingPath);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-brand-red/20 bg-gradient-to-r from-brand-red/10 to-brand-red/5 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-brand-black">
              Your account has been approved
            </p>
            <p className="text-xs text-brand-black/70">
              Complete onboarding to unlock the full experience.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleComplete}
            className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 hover:bg-brand-red"
          >
            Complete onboarding
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full border border-brand-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black/60 transition hover:bg-brand-black/5 hover:text-brand-black"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingReminderBanner;


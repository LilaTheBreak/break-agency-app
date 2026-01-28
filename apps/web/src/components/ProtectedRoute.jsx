import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { NoAccessCard } from "./NoAccessCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { shouldRouteToOnboarding, needsSpecialSetup, getSpecialSetupPath } from "../lib/onboardingState.js";

export function ProtectedRoute({ allowed = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading state only on initial load when user is not yet known
  if (loading && !user) {
    return (
      <Gate
        title="Loading session"
        description="Hold tight — verifying your Break console access."
      />
    );
  }

  if (!user) {
    return (
      <Gate
        title="You're signed out"
        description="Your Break Console session has ended. Sign back in whenever you're ready to keep working."
        actionLabel="Sign in"
        onAction={() => navigate("/login", { state: { from: location } })}
      />
    );
  }

  // Check if user needs onboarding approval (skip for admins/superadmins)
  const userRole = user.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'SUPER_ADMIN';
  
  // Check for special setup flows (UGC profile, Agent CV)
  const requiresSpecialSetup = needsSpecialSetup(user);
  const specialSetupPath = getSpecialSetupPath(user);
  const isOnSpecialSetupRoute = specialSetupPath && location.pathname.startsWith(specialSetupPath);
  
  // UGC and AGENT users: redirect to their setup if they haven't completed it
  if (requiresSpecialSetup && !isOnSpecialSetupRoute && !isAdmin) {
    // TODO: Check if profile/CV already exists to skip this redirect
    return <Navigate to={specialSetupPath} replace />;
  }
  
  const needsOnboarding = shouldRouteToOnboarding(user);
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");

  if (!isAdmin && needsOnboarding && !isOnboardingRoute) {
    // Route to appropriate onboarding based on accountType
    let onboardingPath = "/onboarding"; // Default to creator onboarding
    if (user.accountType === "brand") {
      onboardingPath = "/onboarding/brand";
    } else if (user.accountType === "founder") {
      onboardingPath = "/onboarding/founder";
    }
    const search = userRole ? `?role=${userRole}` : "";
    return <Navigate to={`${onboardingPath}${search}`} replace />;
  }

  // Check if user's role is in the allowed list
  // CRITICAL: SUPERADMIN always has access
  const isSuperAdmin = userRole === 'SUPERADMIN' || userRole === 'SUPER_ADMIN';
  const canAccess = isSuperAdmin || !allowed?.length || allowed.includes(userRole);
  
  if (!canAccess) {
    return <NoAccessCard description="This module is restricted. Contact operations if you believe this is an error." />;
  }

  return children;
}

function Gate({ title, description, actionLabel, onAction }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-brand-linen px-6 py-16 text-center text-brand-black">
      <div className="w-full max-w-xl space-y-5 rounded-[36px] border border-brand-black/10 bg-brand-white p-10 shadow-[0_35px_120px_rgba(0,0,0,0.08)]">
        <p className="text-xs font-subtitle uppercase tracking-[0.35em] text-brand-red">// Session notice</p>
        <h2 className="font-display text-3xl uppercase tracking-wide text-brand-black">{title}</h2>
        <p className="text-brand-black/70">{description}</p>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-brand-black px-7 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red"
          >
            {actionLabel}
          </button>
        ) : null}
        <p className="text-xs text-brand-black/50">Need help? Contact ops@thebreakco.com</p>
      </div>
    </div>
  );
}

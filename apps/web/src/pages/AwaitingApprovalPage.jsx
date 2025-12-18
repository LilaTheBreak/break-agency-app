import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Roles } from "../constants/roles.js";

/**
 * AwaitingApprovalPage
 * 
 * Shown to users whose onboarding_status is not 'approved' and who are not admins.
 * Provides clear messaging that their account is pending review.
 */
export function AwaitingApprovalPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-8 text-center">
        <div className="space-y-2">
          <h1 className="font-display text-3xl uppercase text-brand-black">
            Awaiting approval
          </h1>
          <p className="text-sm text-brand-black/70">
            Your account is currently under review
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-6">
          <p className="text-sm text-brand-black/80">
            Thank you for completing your onboarding. Our team is reviewing your submission and will notify you once your account has been approved.
          </p>
          
          {user?.email && (
            <p className="text-xs text-brand-black/60">
              Registered as: <span className="font-semibold">{user.email}</span>
            </p>
          )}
          
          {user?.onboardingStatus && (
            <p className="text-xs text-brand-black/60">
              Status: <span className="font-semibold capitalize">{user.onboardingStatus.replace('_', ' ')}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-red mb-2">What happens next?</p>
            <ul className="space-y-2 text-sm text-brand-black/70">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our team will review your profile and materials</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll receive an email notification once approved</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>This typically takes 1-2 business days</span>
              </li>
            </ul>
          </div>

          <button
            onClick={logout}
            className="w-full rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black hover:text-brand-white transition-colors"
          >
            Sign out
          </button>
        </div>

        <p className="text-xs text-brand-black/40">
          Questions? Contact us at support@thebreakco.com
        </p>
      </div>
    </div>
  );
}

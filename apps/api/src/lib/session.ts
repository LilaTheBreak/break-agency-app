import { User } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: string; // Single canonical role
  onboardingStatus?: string;
  onboardingComplete?: boolean;
  isApproved?: boolean; // Computed from onboarding_status === "approved"
  brandId?: string; // Brand ID for brand users
  subscription_status?: string; // Subscription status (free, pro, etc.)
  onboarding_status?: string; // Original field name from User
  subscriptionStatus?: string; // Alias for subscription_status
  talentId?: string; // Linked talent ID if user is linked to a talent profile
  talent?: {
    id: string;
    name: string;
    displayName?: string | null;
    representationType?: string | null;
    status?: string | null;
    primaryEmail?: string | null;
    profileImageUrl?: string | null;
  };
};

/**
 * Build session user from database user.
 * CRITICAL: Always include onboardingComplete and onboarding_status.
 * Frontend relies on backend as single source of truth.
 */
export function buildSessionUser(user: User & { Talent?: any }): SessionUser {
  const isApproved = user.onboarding_status?.toLowerCase() === "approved";
  
  // Ensure onboarding fields are always present (backend is source of truth)
  const onboardingComplete = user.onboardingComplete ?? false;
  const onboardingStatus = user.onboarding_status || (onboardingComplete ? "approved" : "not_started");
  
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role, // Single role from User.role enum
    onboardingStatus, // Always present
    onboardingComplete, // Always present
    isApproved
  };
  
  // Include linked talent data if available
  if (user.Talent) {
    sessionUser.talentId = user.Talent.id;
    sessionUser.talent = {
      id: user.Talent.id,
      name: user.Talent.name,
      displayName: user.Talent.displayName,
      representationType: user.Talent.representationType,
      status: user.Talent.status,
      primaryEmail: user.Talent.primaryEmail,
      profileImageUrl: user.Talent.profileImageUrl
    };
  }
  
  return sessionUser;
}

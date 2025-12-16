import { UserRoleType, SubscriptionStatus } from '@prisma/client'; // Assuming you share types

// This matrix should be kept in sync with the backend `permissions.ts`
const permissionMatrix: Record<UserRoleType, string[]> = {
  SUPER_ADMIN: ['admin_panel', 'brand_portal', 'roster_full', 'ai_inbox', 'ai_negotiation', 'contract_review', 'ugc_marketplace'],
  ADMIN: ['admin_panel', 'brand_portal', 'roster_full', 'ai_inbox', 'ai_negotiation', 'contract_review', 'ugc_marketplace'],
  FOUNDER: ['roster_full', 'ai_inbox', 'ai_negotiation', 'contract_review'],
  EXCLUSIVE_TALENT: ['roster_limited', 'ai_inbox', 'ai_negotiation', 'contract_review'],
  TALENT: ['roster_limited'],
  UGC_CREATOR: ['ugc_marketplace'],
  BRAND_PREMIUM: ['brand_portal', 'ugc_marketplace', 'roster_limited'],
  BRAND_FREE: ['brand_portal'],
};

interface UserForCan {
  role?: UserRoleType | null;
  subscription_status?: SubscriptionStatus | null;
}

/**
 * Checks if a user has permission to access a feature.
 * @param user The user object, containing role and subscription status.
 * @param feature The feature to check.
 * @returns `true` if the user has permission, otherwise `false`.
 */
export const can = (user: UserForCan | null | undefined, feature: string): boolean => {
  if (!user || !user.role) {
    return false;
  }

  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  return permissionMatrix[user.role]?.includes(feature) ?? false;
};
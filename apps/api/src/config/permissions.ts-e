/**
 * Permission configuration
 */

export type Feature = "BUNDLES_ENABLED" | "AI_FEATURES_ENABLED";

export const permissions = {
  FEATURE_FLAGS: {
    BUNDLES_ENABLED: process.env.BUNDLES_ENABLED === "true",
    AI_FEATURES_ENABLED: process.env.AI_FEATURES_ENABLED === "true",
  },
  ROLES: {
    CREATOR: ["view_deals", "view_messages"],
    MANAGER: ["view_roster", "manage_outreach"],
    ADMIN: ["manage_users", "manage_all"],
  },
};

export function hasPermission(role: string, permission: string): boolean {
  const rolePerms = permissions.ROLES[role as keyof typeof permissions.ROLES] || [];
  return rolePerms.includes(permission);
}


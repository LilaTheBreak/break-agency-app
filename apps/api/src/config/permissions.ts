/**
 * Permission configuration
 */

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

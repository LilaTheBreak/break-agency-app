/**
 * Feature Flags - Backend
 * 
 * Centralized feature flag configuration for backend routes.
 * Frontend flags are in apps/web/src/config/features.js
 */

export const features = {
  BRIEFS_ENABLED: process.env.BRIEFS_ENABLED === "true",
  XERO_INTEGRATION_ENABLED: process.env.XERO_INTEGRATION_ENABLED === "true",
  CONTRACT_SIGNING_ENABLED: process.env.CONTRACT_SIGNING_ENABLED === "true",
  OUTREACH_LEADS_ENABLED: process.env.OUTREACH_LEADS_ENABLED === "true",
  WEEKLY_REPORTS_ENABLED: process.env.WEEKLY_REPORTS_ENABLED === "true",
  CONTRACT_UPLOAD_ENABLED: process.env.CONTRACT_UPLOAD_ENABLED === "true",
  DEAL_INTELLIGENCE_ENABLED: process.env.DEAL_INTELLIGENCE_ENABLED === "true",
  SOCIAL_ANALYTICS_ENABLED: process.env.SOCIAL_ANALYTICS_ENABLED === "true",
  DASHBOARD_AGGREGATION_ENABLED: process.env.DASHBOARD_AGGREGATION_ENABLED === "true",
  CAMPAIGN_AUTOPLAN_ENABLED: process.env.CAMPAIGN_AUTOPLAN_ENABLED === "true",
  TIKTOK_INTEGRATION_ENABLED: process.env.TIKTOK_INTEGRATION_ENABLED === "true",
  INSTAGRAM_INTEGRATION_ENABLED: process.env.INSTAGRAM_INTEGRATION_ENABLED === "true",
  BUNDLES_ENABLED: process.env.BUNDLES_ENABLED === "true",
};

export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  return features[featureName] === true;
}


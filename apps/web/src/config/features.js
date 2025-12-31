/**
 * Feature Flags — Phase 0: Product Honesty & Safety
 * 
 * This file controls which features are functional vs gated.
 * 
 * ALL FLAGS DEFAULT TO FALSE until backend is ready.
 * 
 * To unlock a feature:
 * 1. Implement the backend API
 * 2. Test the integration
 * 3. Set the flag to true
 * 4. Remove any disable guards in components
 * 
 * DO NOT modify UI/copy when unlocking — only remove gates.
 */

export const features = {
  /**
   * AI Features
   * UNLOCK WHEN: 
   * - OPENAI_API_KEY added to environment
   * - /api/ai/* endpoints tested and working
   * - AI service files return real responses (not stubs)
   */
  AI_ENABLED: true, // ✅ Unlocked: AI assistant backend implemented
  AI_INSIGHTS: true, // ✅ Unlocked: Business summary and insights working
  AI_ASSISTANT: true, // ✅ Unlocked: Role-based AI assistant ready
  AI_REPLY_SUGGESTIONS: true, // ✅ Unlocked: Email reply generation working
  AI_DEAL_EXTRACTION: true, // ✅ Unlocked: Deal extraction from emails working
  AI_SOCIAL_INSIGHTS: false, // TODO: Social insights endpoint needs implementation

  /**
   * Campaign Analytics
   * UNLOCK WHEN:
   * - Real campaign data exists in database (not FALLBACK_CAMPAIGNS)
   * - /api/crm-campaigns returns actual performance metrics
   * - Analytics aggregation service implemented
   */
  CAMPAIGN_ANALYTICS_ENABLED: true, // ✅ Unlocked: Campaign models added to database

  /**
   * Revenue/Finance Dashboards
   * UNLOCK WHEN:
   * - Deal-based revenue calculation service implemented ✅
   * - /api/revenue endpoints functional ✅
   * - Revenue metrics derived from deal values and stages ✅
   * - Clear labeling of projected/contracted/paid states ✅
   */
  REVENUE_DASHBOARD_ENABLED: true, // ✅ Unlocked: Deal-based revenue tracking
  FINANCE_METRICS_ENABLED: true, // ✅ Unlocked: Revenue metrics from deals
  PAYOUT_TRACKING_ENABLED: true, // ✅ Unlocked: Stripe payout creation endpoint implemented
  XERO_INTEGRATION_ENABLED: false, // Xero integration not yet implemented

  /**
   * Social Media Features
   * UNLOCK WHEN:
   * - Social schema models added to database
   * - Social sync services implemented
   * - Platform API integrations connected
   */
  SOCIAL_ANALYTICS_ENABLED: false, // Social schema models removed, needs reimplementation
  SOCIAL_INSIGHTS_ENABLED: false, // Social insights not yet implemented
  TOP_PERFORMING_POSTS_ENABLED: false, // Requires social platform connections

  /**
   * Inbox Scanning
   * UNLOCK WHEN:
   * - Gmail OAuth with gmail.readonly scope working
   * - gmailScanner.ts service implemented
   * - /api/inbox/scan endpoint functional
   * - InboundEmail table populated with real emails
   */
  INBOX_SCANNING_ENABLED: false,
  EMAIL_CLASSIFICATION_ENABLED: false,

  /**
   * Social Media Integrations
   * UNLOCK WHEN:
   * - Instagram Graph API OAuth flow implemented
   * - TikTok API OAuth flow implemented
   * - Social account connections storing real access tokens
   * - Data fetching from social APIs working
   */
  INSTAGRAM_INTEGRATION_ENABLED: false,
  TIKTOK_INTEGRATION_ENABLED: false,
  YOUTUBE_INTEGRATION_ENABLED: false,

  /**
   * Contract Management
   * UNLOCK WHEN:
   * - Contract model added to database ✅
   * - Contract template system built ✅
   * - PDF generation working ✅
   * - Manual signature tracking implemented ✅
   * - E-signature provider integrated (DocuSign/HelloSign) - FUTURE
   */
  CONTRACT_GENERATION_ENABLED: true, // ✅ Unlocked: Template system & PDF generation ready
  CONTRACT_MANUAL_TRACKING_ENABLED: true, // ✅ Unlocked: Manual signature workflow
  CONTRACT_SIGNING_ENABLED: true, // ✅ Phase 5: E-signature routes implemented (uses native provider by default)
  
  /**
   * Deliverables Management
   * UNLOCK WHEN:
   * - Deliverable approval workflow wired ✅
   * - File upload for proof of completion ✅
   * - Status tracking in timeline ✅
   * - Automatic deal advancement on approval ✅
   */
  DELIVERABLES_WORKFLOW_ENABLED: true, // ✅ Unlocked: Complete approval workflow

  /**
   * Messaging/Threads
   * Now always enabled - uses remote API
   * Local/mock messaging mode removed
   */
  MESSAGING_ENABLED: true,

  /**
   * File Upload
   * Enabled when S3/Cloudflare R2 storage is configured via environment variables:
   * - S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
   * - For Cloudflare R2: also set S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   */
  FILE_UPLOAD_ENABLED: true,

  /**
   * Opportunities/Briefs
   * ✅ Unlocked: API implemented and tested
   */
  BRIEF_APPLICATIONS_ENABLED: true,
  BRIEFS_ENABLED: false, // Phase 5: Briefs API re-enabled - set to true when ready
  
  /**
   * Advanced Features
   * UNLOCK WHEN:
   * - Backend services fully implemented
   * - Testing completed
   */
  DEAL_PACKAGES_ENABLED: false, // Deal packages removed from schema
  CREATOR_FIT_BATCH_ENABLED: true, // ✅ Unlocked: Batch fit scoring implemented
  OUTREACH_LEADS_ENABLED: false, // Outreach leads route not implemented
  CONTRACT_ANALYSIS_ENABLED: false, // Contract analysis not yet implemented

  /**
   * Dashboard Feature Sections — Phase 6: Feature Boundary Enforcement
   * UNLOCK WHEN:
   * - Backend API endpoints implemented
   * - Data models complete
   * - Testing verified
   */
  // Brand Dashboard sections
  CREATOR_ROSTER_ENABLED: true, // ✅ Unlocked: Roster management system implemented
  BRAND_SOCIAL_ANALYTICS_ENABLED: false, // Social analytics schema removed
  BRAND_OPPORTUNITIES_ENABLED: true, // ✅ Unlocked: Opportunities API complete
  BRAND_CREATOR_MATCHES_ENABLED: true, // ✅ Unlocked: Transparent fit scoring implemented

  // Creator Dashboard sections
  CREATOR_OPPORTUNITIES_ENABLED: true, // ✅ Unlocked: Creator opportunities API complete
  CREATOR_SUBMISSIONS_ENABLED: true, // ✅ Unlocked: Submissions API implemented
  
  // Exclusive Talent Dashboard sections
  EXCLUSIVE_TASKS_ENABLED: true, // Task management API functional
  EXCLUSIVE_SOCIAL_ANALYTICS_ENABLED: true, // ✅ Phase 5: Social sync infrastructure enabled (requires platform credentials)
  EXCLUSIVE_TRENDING_CONTENT_ENABLED: false, // Trending content API not implemented (defer to post-launch)
  EXCLUSIVE_OPPORTUNITIES_ENABLED: true, // Opportunities API functional
  EXCLUSIVE_FINANCIAL_SUMMARY_ENABLED: true, // Financial summary API functional
  EXCLUSIVE_INVOICES_ENABLED: false, // Invoice management needs Stripe/Xero setup (defer to post-launch)
  EXCLUSIVE_MESSAGES_ENABLED: true, // Messaging API functional (uses Thread/Message models)
  EXCLUSIVE_ALERTS_ENABLED: true, // Alerts system functional (uses CreatorInsight model)
  EXCLUSIVE_RESOURCES_ENABLED: false, // Resources management not implemented (defer to post-launch)

  // Admin User Management sections
  USER_IMPERSONATION_ENABLED: false, // Security-sensitive, not implemented
  USER_PASSWORD_RESET_ENABLED: false, // Password reset API not implemented
  USER_FORCE_LOGOUT_ENABLED: false, // Force logout API not implemented

  /**
   * Phase 5: Advanced Features & Power Tools
   * All features are optional, independently deployable, and disabled by default.
   * These are "power tools" for advanced users, not core product features.
   */
  GLOBAL_SEARCH_ENABLED: true, // ✅ Phase 5: Global search implemented
  TRENDING_CONTENT_ENABLED: false, // Phase 5: Trending content feed
  ADVANCED_ANALYTICS_ENABLED: false, // Phase 5: Backend analytics aggregation
  SLACK_INTEGRATION_ENABLED: false, // Phase 5: Slack notifications integration
  NOTION_INTEGRATION_ENABLED: false, // Phase 5: Notion sync integration
  GOOGLE_DRIVE_INTEGRATION_ENABLED: false, // Phase 5: Google Drive file linking
};

/**
 * Helper function to check if feature is enabled
 * @param {string} featureName - Name of feature flag
 * @returns {boolean}
 */
export function isFeatureEnabled(featureName) {
  return features[featureName] === true;
}

/**
 * Get disabled message for a feature
 * Returns user-friendly message explaining why feature is gated
 */
export function getDisabledMessage(featureName) {
  const messages = {
    AI_ENABLED: "AI features will be available once connected.",
    AI_INSIGHTS: "AI insights will be available once connected.",
    AI_ASSISTANT: "AI assistant will be available once connected.",
    AI_REPLY_SUGGESTIONS: "Reply suggestions will be available once connected.",
    AI_DEAL_EXTRACTION: "Deal extraction will be available once connected.",
    AI_SOCIAL_INSIGHTS: "Social insights will be available once connected.",
    
    CAMPAIGN_ANALYTICS_ENABLED: "Analytics will populate once campaigns have performance data.",
    
    REVENUE_DASHBOARD_ENABLED: "Revenue tracking will be available once payment integration is complete.",
    FINANCE_METRICS_ENABLED: "Finance metrics will be available once payment integration is complete.",
    PAYOUT_TRACKING_ENABLED: "Payout tracking will be available once payment integration is complete.",
    XERO_INTEGRATION_ENABLED: "Xero integration coming soon.",
    
    SOCIAL_ANALYTICS_ENABLED: "Social analytics will be available once platform connections are restored.",
    SOCIAL_INSIGHTS_ENABLED: "Social insights coming soon.",
    TOP_PERFORMING_POSTS_ENABLED: "Top performing posts will be available once social platforms are connected.",
    
    INBOX_SCANNING_ENABLED: "Inbox scanning will be available once email integration is connected.",
    EMAIL_CLASSIFICATION_ENABLED: "Email classification will be available once inbox is connected.",
    
    INSTAGRAM_INTEGRATION_ENABLED: "Instagram integration coming soon.",
    TIKTOK_INTEGRATION_ENABLED: "TikTok integration coming soon.",
    YOUTUBE_INTEGRATION_ENABLED: "YouTube integration coming soon.",
    
    CONTRACT_SIGNING_ENABLED: "Contract signing will be available once e-signature provider is connected.",
    CONTRACT_GENERATION_ENABLED: "Contract generation will be available once templates are configured.",
    
    MESSAGING_ENABLED: "Messaging is now available.",
    
    FILE_UPLOAD_ENABLED: "File upload will be available once storage is configured.",
    
    BRIEF_APPLICATIONS_ENABLED: "Applications will be available once the review workflow is ready.",
    
    DEAL_PACKAGES_ENABLED: "Deal packages feature is being redesigned.",
    CREATOR_FIT_BATCH_ENABLED: "Batch creator matching coming soon.",
    OUTREACH_LEADS_ENABLED: "Outreach leads feature coming soon.",
    CONTRACT_ANALYSIS_ENABLED: "Contract analysis coming soon.",

    // Dashboard sections
    CREATOR_ROSTER_ENABLED: "Creator roster management coming soon.",
    BRAND_SOCIAL_ANALYTICS_ENABLED: "Social analytics coming soon. Connect Instagram/TikTok when available.",
    BRAND_OPPORTUNITIES_ENABLED: "Opportunities marketplace coming soon.",
    BRAND_CREATOR_MATCHES_ENABLED: "AI-powered creator matching coming soon.",
    CREATOR_OPPORTUNITIES_ENABLED: "Creator opportunities coming soon.",
    CREATOR_SUBMISSIONS_ENABLED: "Submission workflow coming soon.",
    EXCLUSIVE_TASKS_ENABLED: "Task management coming soon.",
    EXCLUSIVE_SOCIAL_ANALYTICS_ENABLED: "Social platform analytics coming soon.",
    EXCLUSIVE_TRENDING_CONTENT_ENABLED: "Trending content feed coming soon.",
    EXCLUSIVE_OPPORTUNITIES_ENABLED: "Exclusive opportunities coming soon.",
    EXCLUSIVE_FINANCIAL_SUMMARY_ENABLED: "Financial summary coming soon. Stripe integration required.",
    EXCLUSIVE_INVOICES_ENABLED: "Invoice management coming soon.",
    EXCLUSIVE_MESSAGES_ENABLED: "Direct messaging coming soon.",
    EXCLUSIVE_ALERTS_ENABLED: "Alert system coming soon.",
    EXCLUSIVE_RESOURCES_ENABLED: "Resource library coming soon.",
    USER_IMPERSONATION_ENABLED: "User impersonation coming soon.",
    USER_PASSWORD_RESET_ENABLED: "Password reset via email coming soon.",
    USER_FORCE_LOGOUT_ENABLED: "Force logout coming soon.",
  };

  return messages[featureName] || "This feature is not yet available.";
}

/**
 * Get all feature flags as a snapshot object
 * Useful for error reporting and debugging
 */
export function getAllFeatureFlags() {
  return { ...features };
}

export default features;

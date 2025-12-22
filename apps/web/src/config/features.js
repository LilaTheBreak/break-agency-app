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
   * - Stripe integration tested (STRIPE_SECRET_KEY configured)
   * - /api/payments endpoints functional
   * - Invoice/payout data coming from real transactions
   * - No hardcoded revenue numbers in code
   */
  REVENUE_DASHBOARD_ENABLED: false,
  FINANCE_METRICS_ENABLED: false,
  PAYOUT_TRACKING_ENABLED: false,

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
   * - E-signature provider integrated (DocuSign/HelloSign)
   * - Contract template system built
   * - PDF generation working
   * - Signature webhook tested
   */
  CONTRACT_SIGNING_ENABLED: false,
  CONTRACT_GENERATION_ENABLED: false,

  /**
   * Messaging/Threads
   * UNLOCK WHEN:
   * - Real-time messaging backend implemented
   * - Message sending API functional
   * - Thread persistence working
   */
  MESSAGING_ENABLED: false,

  /**
   * File Upload
   * UNLOCK WHEN:
   * - S3/Cloudflare R2/storage backend configured
   * - File upload API tested
   * - File validation implemented
   */
  FILE_UPLOAD_ENABLED: false,

  /**
   * Opportunities/Briefs
   * UNLOCK WHEN:
   * - Brief submission API implemented
   * - Application workflow built
   * - Admin review interface functional
   */
  BRIEF_APPLICATIONS_ENABLED: false,
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
    
    INBOX_SCANNING_ENABLED: "Inbox scanning will be available once email integration is connected.",
    EMAIL_CLASSIFICATION_ENABLED: "Email classification will be available once inbox is connected.",
    
    INSTAGRAM_INTEGRATION_ENABLED: "Instagram integration coming soon.",
    TIKTOK_INTEGRATION_ENABLED: "TikTok integration coming soon.",
    YOUTUBE_INTEGRATION_ENABLED: "YouTube integration coming soon.",
    
    CONTRACT_SIGNING_ENABLED: "Contract signing will be available once e-signature provider is connected.",
    CONTRACT_GENERATION_ENABLED: "Contract generation will be available once templates are configured.",
    
    MESSAGING_ENABLED: "Messaging will be available once real-time backend is ready.",
    
    FILE_UPLOAD_ENABLED: "File upload will be available once storage is configured.",
    
    BRIEF_APPLICATIONS_ENABLED: "Applications will be available once the review workflow is ready.",
  };

  return messages[featureName] || "This feature is not yet available.";
}

export default features;

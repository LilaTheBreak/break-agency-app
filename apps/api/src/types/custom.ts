/**
 * Custom type definitions for application domain concepts
 * These extend Prisma's generated types with application-specific concepts
 */

/**
 * User role types in the system
 */
export type UserRoleType = 
  | 'CREATOR'
  | 'MANAGER'
  | 'TALENT_MANAGER'
  | 'ADMIN'
  | 'SUPERADMIN'
  | string;

/**
 * Subscription status types
 */
export type SubscriptionStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | string;

/**
 * Deal stage types
 */
export type DealStageType =
  | 'NEW_LEAD'
  | 'CONTACTED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'DEAL_WON'
  | 'CLOSED_LOST'
  | 'CANCELLED'
  | string;

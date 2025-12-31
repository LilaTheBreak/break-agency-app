/**
 * Zod Validation Schemas for API Contract Safety
 * 
 * Validates incoming request bodies and outgoing responses
 * to ensure consistent API contracts.
 */

import { z } from "zod";

// ============================================
// CAMPAIGNS
// ============================================

export const CampaignCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  ownerId: z.string().uuid().optional(),
  stage: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  brands: z.array(z.string()).optional(),
  creatorTeams: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const CampaignUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  stage: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  brands: z.array(z.string()).optional(),
  creatorTeams: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const CampaignResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  ownerId: z.string().uuid().nullable(),
  stage: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// ============================================
// OPPORTUNITIES
// ============================================

export const OpportunityCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  brandId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  deadline: z.string().datetime().optional(),
  payment: z.number().positive().optional(),
});

export const OpportunityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  deadline: z.string().datetime().optional(),
  payment: z.number().positive().optional(),
});

export const OpportunityResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  brandId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// ============================================
// TALENT
// ============================================

export const TalentCreateSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  legalName: z.string().optional(),
  primaryEmail: z.string().email().optional().or(z.literal("")),
  representationType: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE", "FRIEND_OF_HOUSE", "UGC", "FOUNDER"]),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  managerId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const TalentUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  legalName: z.string().optional(),
  primaryEmail: z.string().email().optional().or(z.literal("")),
  representationType: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE", "FRIEND_OF_HOUSE", "UGC", "FOUNDER"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  managerId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

export const TalentLinkUserSchema = z.object({
  userId: z.string().uuid().min(1, "User ID is required"),
});

export const TalentResponseSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  legalName: z.string().nullable(),
  primaryEmail: z.string().nullable(),
  representationType: z.string(),
  status: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// ============================================
// ACTIVITY
// ============================================

export const ActivityResponseSchema = z.object({
  id: z.string().uuid(),
  event: z.string(),
  actorId: z.string().uuid().nullable(),
  createdAt: z.date().or(z.string()),
  user: z.object({
    name: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }).nullable().optional(),
});

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate request body against schema
 * Returns validated data or throws ZodError
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate request body safely (returns error instead of throwing)
 */
export function validateRequestSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate response data against schema (for testing/debugging)
 * Logs warnings but doesn't throw in production
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = "response"
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[Validation] ${context} failed validation:`, result.error.format());
    return null;
  }
  return result.data;
}


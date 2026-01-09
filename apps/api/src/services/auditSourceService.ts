/**
 * Audit Source Service
 * 
 * Manages tracking of brand audit sources (website, social, community, product, campaign)
 * Extensible foundation for future AI insights
 */

import prisma from "../lib/prisma.js";

export type AuditSourceType = "website" | "social" | "community" | "product" | "campaign";
export type AuditStatus = "connected" | "pending" | "error";

export interface CreateAuditSourceInput {
  brandId: string;
  type: AuditSourceType;
  source: string; // URL, handle, channel name, etc.
  metadata?: Record<string, any>;
}

export interface UpdateAuditSourceInput {
  status?: AuditStatus;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Create or update an audit source
 */
export async function upsertAuditSource(input: CreateAuditSourceInput) {
  const { brandId, type, source } = input;

  const auditSource = await prisma.auditSource.upsert({
    where: {
      brandId_type_source: {
        brandId,
        type,
        source,
      },
    },
    create: {
      brandId,
      type,
      source,
      status: "pending",
      metadata: input.metadata || {},
    },
    update: {
      status: "pending",
      metadata: input.metadata || {},
    },
  });

  return auditSource;
}

/**
 * Get audit source
 */
export async function getAuditSource(auditSourceId: string) {
  const auditSource = await prisma.auditSource.findUnique({
    where: { id: auditSourceId },
  });

  return auditSource;
}

/**
 * Get brand audit sources
 */
export async function getBrandAuditSources(brandId: string) {
  const auditSources = await prisma.auditSource.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
  });

  return auditSources;
}

/**
 * Get audit sources by type
 */
export async function getAuditSourcesByType(
  brandId: string,
  type: AuditSourceType
) {
  const auditSources = await prisma.auditSource.findMany({
    where: { brandId, type },
    orderBy: { createdAt: "desc" },
  });

  return auditSources;
}

/**
 * Update audit source status
 */
export async function updateAuditSourceStatus(
  auditSourceId: string,
  input: UpdateAuditSourceInput
) {
  const auditSource = await prisma.auditSource.update({
    where: { id: auditSourceId },
    data: {
      status: input.status,
      error: input.error || null,
      metadata: input.metadata,
      lastCheckedAt: new Date(),
    },
  });

  return auditSource;
}

/**
 * Mark audit source as connected
 */
export async function markAuditSourceConnected(
  auditSourceId: string,
  metadata?: Record<string, any>
) {
  return updateAuditSourceStatus(auditSourceId, {
    status: "connected",
    metadata,
    error: undefined,
  });
}

/**
 * Mark audit source as error
 */
export async function markAuditSourceError(
  auditSourceId: string,
  errorMessage: string,
  metadata?: Record<string, any>
) {
  return updateAuditSourceStatus(auditSourceId, {
    status: "error",
    error: errorMessage,
    metadata,
  });
}

/**
 * Delete audit source
 */
export async function deleteAuditSource(auditSourceId: string) {
  await prisma.auditSource.delete({
    where: { id: auditSourceId },
  });
}

/**
 * Get audit summary for brand
 * Returns count of connected sources by type
 */
export async function getAuditSummary(brandId: string) {
  const auditSources = await getBrandAuditSources(brandId);

  const summary: Record<AuditSourceType, { total: number; connected: number }> =
    {
      website: { total: 0, connected: 0 },
      social: { total: 0, connected: 0 },
      community: { total: 0, connected: 0 },
      product: { total: 0, connected: 0 },
      campaign: { total: 0, connected: 0 },
    };

  auditSources.forEach((source) => {
    summary[source.type as AuditSourceType].total++;
    if (source.status === "connected") {
      summary[source.type as AuditSourceType].connected++;
    }
  });

  return summary;
}

/**
 * Initialize default audit sources for brand
 * Called when brand is created
 */
export async function initializeBrandAuditSources(
  brandId: string,
  websiteUrl: string
) {
  // Create website audit source
  await upsertAuditSource({
    brandId,
    type: "website",
    source: websiteUrl,
    metadata: {
      lastChecked: null,
    },
  });

  // Placeholder for social, community, product audits
  // Users will add these manually through the dashboard
}

/**
 * Check if audit source exists
 */
export async function auditSourceExists(
  brandId: string,
  type: AuditSourceType,
  source: string
): Promise<boolean> {
  const count = await prisma.auditSource.count({
    where: { brandId, type, source },
  });

  return count > 0;
}

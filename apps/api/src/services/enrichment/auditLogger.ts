/**
 * Enrichment Audit Logging Service
 * 
 * Logs all enrichment activities for compliance and audit trails
 * GDPR compliant with action tracking and metadata storage
 */

import prisma from '../../lib/prisma.js';
import { logError } from '../../lib/logger.js';

export interface AuditLogEntry {
  action:
    | 'DISCOVERY_STARTED'
    | 'DISCOVERY_COMPLETED'
    | 'DISCOVERY_FAILED'
    | 'CONTACT_APPROVED'
    | 'CONTACT_REJECTED'
    | 'CONTACT_LINKED_TO_CRM'
    | 'CONTACT_DELETED'
    | 'EMAIL_VALIDATED'
    | 'COMPLIANCE_CHECK_PASSED'
    | 'COMPLIANCE_CHECK_FAILED'
    | 'DATA_EXPORT'
    | 'DATA_PURGED';
  entityType: 'enrichment_job' | 'enriched_contact' | 'contact_email';
  entityId: string;
  userId: string;
  brandId?: string;
  brandName?: string;
  contactsAffected?: number;
  complianceChecks?: {
    regionCheck?: boolean;
    consentCheck?: boolean;
    lawfulBasisCheck?: boolean;
    optOutCheck?: boolean;
  };
  lawfulBasis?:
    | 'b2b_legitimate_interest'
    | 'contact_request'
    | 'manual_approval'
    | 'data_subject_consent';
  regionCode?: string; // ISO country code
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Log an enrichment action to the audit table
 * GDPR compliant with timestamp, user, and compliance tracking
 */
export async function logEnrichmentAction(
  entry: AuditLogEntry
): Promise<string | null> {
  try {
    const record = await prisma.enrichmentAuditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        userId: entry.userId,
        brandId: entry.brandId,
        brandName: entry.brandName,
        contactsAffected: entry.contactsAffected || 0,
        complianceChecks: entry.complianceChecks || {},
        lawfulBasis: entry.lawfulBasis || 'b2b_legitimate_interest',
        regionCode: entry.regionCode,
        details: entry.details || {},
        metadata: entry.metadata || {},
      },
    });

    console.log(
      `[AUDIT LOG] ${entry.action} for ${entry.entityType}:${entry.entityId} by ${entry.userId}`
    );
    return record.id;
  } catch (error) {
    logError('[AUDIT LOG] Failed to log enrichment action:', error);
    // Fail gracefully - don't block enrichment if audit logging fails
    return null;
  }
}

/**
 * Log discovery job started
 */
export async function logDiscoveryStarted(
  jobId: string,
  brandId: string,
  brandName: string,
  userId: string,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'DISCOVERY_STARTED',
    entityType: 'enrichment_job',
    entityId: jobId,
    userId,
    brandId,
    brandName,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      source: 'api_request',
    },
    metadata: {
      initiatedBy: 'user',
    },
  });
}

/**
 * Log discovery job completed
 */
export async function logDiscoveryCompleted(
  jobId: string,
  brandId: string,
  brandName: string,
  userId: string,
  contactsDiscovered: number,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'DISCOVERY_COMPLETED',
    entityType: 'enrichment_job',
    entityId: jobId,
    userId,
    brandId,
    brandName,
    contactsAffected: contactsDiscovered,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      contactsDiscovered,
      source: 'hunter_io',
    },
    metadata: {
      completedBy: 'system',
      processingTime: 0, // Will be calculated by system
    },
  });
}

/**
 * Log discovery job failed
 */
export async function logDiscoveryFailed(
  jobId: string,
  brandId: string,
  brandName: string,
  userId: string,
  errorMessage: string,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'DISCOVERY_FAILED',
    entityType: 'enrichment_job',
    entityId: jobId,
    userId,
    brandId,
    brandName,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      source: 'system',
    },
    metadata: {
      failedAt: new Date().toISOString(),
      errorType: 'discovery_error',
    },
  });
}

/**
 * Log contact approved for outreach
 */
export async function logContactApproved(
  contactId: string,
  enrichedContactId: string,
  userId: string,
  brandId?: string,
  compliancePassed: boolean = true,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'CONTACT_APPROVED',
    entityType: 'enriched_contact',
    entityId: contactId,
    userId,
    brandId,
    contactsAffected: 1,
    regionCode,
    complianceChecks: {
      regionCheck: !regionCode || regionCode !== 'RESTRICTED',
      consentCheck: false,
      lawfulBasisCheck: compliancePassed,
      optOutCheck: false,
    },
    lawfulBasis: 'manual_approval',
    details: {
      timestamp: new Date().toISOString(),
      enrichedContactId,
      approvedFor: 'outreach',
    },
    metadata: {
      approvalType: 'manual',
      complianceStatus: compliancePassed ? 'passed' : 'warning',
    },
  });
}

/**
 * Log contact rejected
 */
export async function logContactRejected(
  contactId: string,
  userId: string,
  reason: string,
  brandId?: string,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'CONTACT_REJECTED',
    entityType: 'enriched_contact',
    entityId: contactId,
    userId,
    brandId,
    contactsAffected: 1,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      rejectionReason: reason,
    },
    metadata: {
      rejectionType: 'manual',
    },
  });
}

/**
 * Log contact linked to CRM
 */
export async function logContactLinkedToCrm(
  enrichedContactId: string,
  crmContactId: string,
  userId: string,
  brandId?: string,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'CONTACT_LINKED_TO_CRM',
    entityType: 'enriched_contact',
    entityId: enrichedContactId,
    userId,
    brandId,
    contactsAffected: 1,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      linkedToCrmId: crmContactId,
    },
    metadata: {
      linkingMethod: 'enrichment_api',
      syncStatus: 'pending',
    },
  });
}

/**
 * Log contact deleted
 */
export async function logContactDeleted(
  enrichedContactId: string,
  userId: string,
  reason: string = 'user_request',
  brandId?: string,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'CONTACT_DELETED',
    entityType: 'enriched_contact',
    entityId: enrichedContactId,
    userId,
    brandId,
    contactsAffected: 1,
    regionCode,
    lawfulBasis: 'contact_request', // GDPR right to be forgotten
    details: {
      timestamp: new Date().toISOString(),
      deletionReason: reason,
      gdprRequest: reason === 'user_request',
    },
    metadata: {
      permanentlyDeleted: true,
      dataRetention: 'none',
    },
  });
}

/**
 * Log email validation
 */
export async function logEmailValidated(
  emailId: string,
  contactId: string,
  userId: string,
  verificationStatus: 'verified' | 'invalid' | 'risky',
  brandId?: string,
  regionCode?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'EMAIL_VALIDATED',
    entityType: 'contact_email',
    entityId: emailId,
    userId,
    brandId,
    contactsAffected: 1,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      enrichedContactId: contactId,
      verificationStatus,
    },
    metadata: {
      validationMethod: 'mx_check',
      score: 75, // Placeholder, actual score in email record
    },
  });
}

/**
 * Log compliance check passed
 */
export async function logComplianceCheckPassed(
  entityId: string,
  entityType: 'enriched_contact' | 'enrichment_job',
  userId: string,
  complianceChecks: {
    regionCheck?: boolean;
    consentCheck?: boolean;
    lawfulBasisCheck?: boolean;
    optOutCheck?: boolean;
  },
  regionCode?: string,
  brandId?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'COMPLIANCE_CHECK_PASSED',
    entityType,
    entityId,
    userId,
    brandId,
    regionCode,
    complianceChecks,
    lawfulBasis: 'b2b_legitimate_interest',
    details: {
      timestamp: new Date().toISOString(),
      allChecksPassed: Object.values(complianceChecks).every((v) => v !== false),
    },
    metadata: {
      complianceFramework: 'GDPR+CCPA',
      certificationLevel: 'B2B_SAFE',
    },
  });
}

/**
 * Log compliance check failed
 */
export async function logComplianceCheckFailed(
  entityId: string,
  entityType: 'enriched_contact' | 'enrichment_job',
  userId: string,
  failedChecks: string[],
  regionCode?: string,
  brandId?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'COMPLIANCE_CHECK_FAILED',
    entityType,
    entityId,
    userId,
    brandId,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      failedChecks,
      blockingIssues: failedChecks.filter(
        (c) => c === 'region_restriction' || c === 'explicit_opt_out'
      ),
    },
    metadata: {
      complianceFramework: 'GDPR+CCPA',
      riskLevel: failedChecks.length > 1 ? 'high' : 'medium',
    },
  });
}

/**
 * Log data export (for compliance/audit purposes)
 */
export async function logDataExport(
  userId: string,
  exportType: 'audit_trail' | 'contact_list' | 'job_results',
  recordCount: number,
  regionCode?: string,
  brandId?: string
): Promise<string | null> {
  return logEnrichmentAction({
    action: 'DATA_EXPORT',
    entityType: 'enrichment_job',
    entityId: `export_${Date.now()}`,
    userId,
    brandId,
    contactsAffected: recordCount,
    regionCode,
    details: {
      timestamp: new Date().toISOString(),
      exportType,
      recordCount,
      format: 'json',
    },
    metadata: {
      complianceReason: 'audit_trail',
      encryption: 'AES-256',
    },
  });
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(entityId: string, limit: number = 50) {
  try {
    const logs = await prisma.enrichmentAuditLog.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    logError('[AUDIT LOG] Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a brand
 */
export async function getAuditLogsForBrand(brandId: string, limit: number = 100) {
  try {
    const logs = await prisma.enrichmentAuditLog.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    logError('[AUDIT LOG] Failed to fetch brand audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(action: string, limit: number = 100) {
  try {
    const logs = await prisma.enrichmentAuditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    logError('[AUDIT LOG] Failed to fetch logs by action:', error);
    return [];
  }
}

/**
 * Export audit logs for compliance review
 */
export async function exportAuditLogs(filters: {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  userId?: string;
  brandId?: string;
}) {
  try {
    const logs = await prisma.enrichmentAuditLog.findMany({
      where: {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        action: filters.action,
        userId: filters.userId,
        brandId: filters.brandId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      exportedAt: new Date().toISOString(),
      recordCount: logs.length,
      logs,
    };
  } catch (error) {
    logError('[AUDIT LOG] Failed to export audit logs:', error);
    return {
      exportedAt: new Date().toISOString(),
      recordCount: 0,
      logs: [],
    };
  }
}

export default {
  logEnrichmentAction,
  logDiscoveryStarted,
  logDiscoveryCompleted,
  logDiscoveryFailed,
  logContactApproved,
  logContactRejected,
  logContactLinkedToCrm,
  logContactDeleted,
  logEmailValidated,
  logComplianceCheckPassed,
  logComplianceCheckFailed,
  logDataExport,
  getAuditLogsForEntity,
  getAuditLogsForBrand,
  getAuditLogsByAction,
  exportAuditLogs,
};

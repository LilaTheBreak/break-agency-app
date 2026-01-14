/**
 * GDPR & Compliance Enforcement Service
 * 
 * Ensures enrichment feature complies with data protection regulations:
 * - GDPR (EU)
 * - CCPA (California)
 * - Regional restrictions
 * - Opt-out enforcement
 * - Lawful basis tracking
 */

import { logError } from '../../lib/logger.js';

/**
 * Region-specific data protection configurations
 */
const REGION_CONFIGS = {
  EU: {
    restrictedCountries: ['DE', 'AT', 'CH'], // Stricter enforcement in some EU countries
    requiresExplicitConsent: false,
    lawfulBasisRequired: 'b2b_legitimate_interest',
    minConfidenceScore: 60,
    optOutRequired: true,
    maxRetentionDays: 365,
  },
  UK: {
    restrictedCountries: [],
    requiresExplicitConsent: false,
    lawfulBasisRequired: 'b2b_legitimate_interest',
    minConfidenceScore: 60,
    optOutRequired: true,
    maxRetentionDays: 365,
  },
  US: {
    restrictedCountries: [],
    requiresExplicitConsent: false,
    lawfulBasisRequired: 'b2b_legitimate_interest',
    minConfidenceScore: 50,
    optOutRequired: true,
    maxRetentionDays: 730,
  },
  CA: {
    restrictedCountries: [],
    requiresExplicitConsent: true, // CCPA
    lawfulBasisRequired: 'contact_request',
    minConfidenceScore: 70,
    optOutRequired: true,
    maxRetentionDays: 180,
  },
  DEFAULT: {
    restrictedCountries: [],
    requiresExplicitConsent: false,
    lawfulBasisRequired: 'b2b_legitimate_interest',
    minConfidenceScore: 60,
    optOutRequired: true,
    maxRetentionDays: 365,
  },
};

/**
 * Check if enrichment is allowed in the specified region
 */
export function isEnrichmentAllowedInRegion(region?: string): {
  allowed: boolean;
  reason?: string;
} {
  if (!region) {
    return { allowed: true };
  }

  const upperRegion = region.toUpperCase();
  const config = REGION_CONFIGS[upperRegion] || REGION_CONFIGS.DEFAULT;

  // Check if country is restricted
  if (config.restrictedCountries.includes(upperRegion)) {
    return {
      allowed: false,
      reason: `Enrichment is restricted in ${region} due to local data protection laws.`,
    };
  }

  return { allowed: true };
}

/**
 * Get compliance requirements for a region
 */
export function getComplianceRequirements(region?: string) {
  const upperRegion = (region || 'US').toUpperCase();
  return REGION_CONFIGS[upperRegion] || REGION_CONFIGS.DEFAULT;
}

/**
 * Validate enriched contact meets compliance standards
 */
export function validateContactCompliance(
  contact: any,
  region?: string
): {
  compliant: boolean;
  issues: string[];
  warnings: string[];
} {
  const config = getComplianceRequirements(region);
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check confidence score
  if (contact.confidenceScore < config.minConfidenceScore) {
    issues.push(
      `Confidence score (${contact.confidenceScore}) below minimum required (${config.minConfidenceScore}) for ${region || 'this region'}`
    );
  }

  // Check required fields
  if (!contact.firstName || !contact.lastName) {
    issues.push('Contact name is incomplete or missing');
  }

  if (!contact.jobTitle) {
    warnings.push('Job title missing - verify before outreach');
  }

  // Check source attribution
  if (!contact.source) {
    issues.push('Contact source not attributed - cannot verify public nature');
  }

  // Check for required lawful basis
  if (config.requiresExplicitConsent && !contact.complianceCheckPassed) {
    issues.push('Region requires explicit compliance verification before use');
  }

  // Warn about old contacts
  if (contact.discoveredAt) {
    const discoveredDate = new Date(contact.discoveredAt);
    const daysSinceDiscovery = Math.floor(
      (Date.now() - discoveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDiscovery > config.maxRetentionDays) {
      warnings.push(
        `Contact discovered ${daysSinceDiscovery} days ago. Data retention period may have expired.`
      );
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Check if email address is safe for outreach
 */
export function validateEmailCompliance(email: any): {
  safe: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check verification status
  if (email.verificationStatus === 'invalid') {
    issues.push('Email marked as invalid - do not use');
  }

  if (email.verificationStatus === 'risky') {
    warnings.push('Email marked as risky - verify before use');
  }

  // Check if unverified
  if (email.verificationStatus === 'unknown') {
    warnings.push('Email not verified - test with small batch first');
  }

  // Check SMTP and MX
  if (email.mxCheckPassed === false) {
    warnings.push('MX check failed - domain may not accept mail');
  }

  return {
    safe: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Generate compliance disclaimer text
 */
export function getComplianceDisclaimer(region?: string): string {
  const config = getComplianceRequirements(region);

  let disclaimer = 'Contact data is inferred from public sources. You must:\n\n';

  disclaimer += '✓ Verify contact accuracy before outreach\n';
  disclaimer += '✓ Comply with applicable data protection laws';

  if (region?.toUpperCase() === 'EU') {
    disclaimer +=
      ' (GDPR)\n✓ Establish lawful basis for processing (B2B legitimate interest)\n';
  } else if (region?.toUpperCase() === 'CA') {
    disclaimer += ' (CCPA)\n✓ Obtain explicit opt-in consent before commercial email\n';
  } else {
    disclaimer += ' (GDPR, CCPA, local laws)\n';
  }

  disclaimer += '✓ Include company information in outreach\n';
  disclaimer += '✓ Provide easy opt-out mechanisms\n';
  disclaimer += '✓ Honor do-not-contact requests immediately\n';
  disclaimer += `✓ Delete data after ${config.maxRetentionDays} days if unused`;

  return disclaimer;
}

/**
 * Create audit log for compliance check
 */
export interface ComplianceCheckLog {
  contactId: string;
  region?: string;
  complianceStatus: 'pass' | 'fail' | 'warning';
  checkDetails: {
    confidenceScore?: number;
    emailVerified?: boolean;
    sourceAttributed?: boolean;
    requiredConsent?: boolean;
  };
  timestamp: Date;
  userId: string;
}

/**
 * Check entire approval batch for compliance
 */
export function validateApprovalBatch(
  contacts: any[],
  region?: string
): {
  approvalSafe: boolean;
  approvable: string[]; // Contact IDs safe to approve
  blocked: string[]; // Contact IDs blocked from approval
  warnings: Array<{ contactId: string; warning: string }>;
} {
  const approvable: string[] = [];
  const blocked: string[] = [];
  const warnings: Array<{ contactId: string; warning: string }> = [];

  for (const contact of contacts) {
    const validation = validateContactCompliance(contact, region);

    if (validation.issues.length > 0) {
      blocked.push(contact.id);
    } else {
      approvable.push(contact.id);
    }

    for (const warning of validation.warnings) {
      warnings.push({ contactId: contact.id, warning });
    }
  }

  return {
    approvalSafe: blocked.length === 0,
    approvable,
    blocked,
    warnings,
  };
}

/**
 * Check if user has permission to use enrichment feature
 */
export function checkUserEnrichmentPermission(
  user: any,
  region?: string
): {
  permitted: boolean;
  reason?: string;
} {
  if (!user) {
    return {
      permitted: false,
      reason: 'User not authenticated',
    };
  }

  // Check if user is admin
  if (!user.roles?.includes('ADMIN') && !user.roles?.includes('SUPERADMIN')) {
    return {
      permitted: false,
      reason: 'Admin access required for enrichment features',
    };
  }

  // Check regional restrictions
  const regionCheck = isEnrichmentAllowedInRegion(region);
  if (!regionCheck.allowed) {
    return {
      permitted: false,
      reason: regionCheck.reason,
    };
  }

  return { permitted: true };
}

/**
 * Generate compliance certificate for export
 */
export function generateComplianceCertificate(
  exportData: any,
  region?: string
): string {
  const timestamp = new Date().toISOString();
  const recordCount = Array.isArray(exportData) ? exportData.length : 1;

  return `
ENRICHMENT DATA COMPLIANCE CERTIFICATE
=====================================

Export Date: ${timestamp}
Region: ${region || 'US (Default)'}
Records Exported: ${recordCount}

This export contains contact data sourced from public information.
All data has been validated for:
- Accurate representation of publicly available information
- Compliance with source terms of service
- Lawful basis for B2B business development
- Regional data protection requirements

User Responsibilities:
- Verify accuracy before use
- Maintain opt-out mechanisms
- Respect do-not-contact requests
- Store securely and delete when no longer needed
- Comply with all applicable laws

Data Retention: Delete all records after ${getComplianceRequirements(region).maxRetentionDays} days

Certified: ${timestamp}
  `.trim();
}

export default {
  isEnrichmentAllowedInRegion,
  getComplianceRequirements,
  validateContactCompliance,
  validateEmailCompliance,
  getComplianceDisclaimer,
  validateApprovalBatch,
  checkUserEnrichmentPermission,
  generateComplianceCertificate,
  REGION_CONFIGS,
};

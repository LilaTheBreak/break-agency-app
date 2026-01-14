/**
 * Enrichment Job Orchestrator
 * 
 * Coordinates the entire enrichment pipeline:
 * 1. Validate compliance
 * 2. Discover contacts
 * 3. Enrich with emails
 * 4. Create outreach queue entries
 * 5. Audit logging
 */

import prisma from '../../lib/prisma.js';
import { logError } from '../../lib/logger.js';
import {
  discoverContactsFromLinkedIn,
  discoverContactsFromWebsite,
  enrichDiscoveredContacts,
  isRegionCompliant,
} from './contactDiscoveryService.js';
import {
  enrichContactWithEmails,
  extractDomainFromUrl,
} from './emailEnrichmentService.js';
import {
  logDiscoveryStarted,
  logDiscoveryCompleted,
  logDiscoveryFailed,
  logContactApproved,
} from './auditLogger.js';

export interface EnrichmentJobRequest {
  brandId?: string;
  brandName: string;
  website?: string;
  linkedInCompanyUrl?: string;
  region?: string;
  userId: string;
  autoApprove?: boolean; // Skip manual review
}

/**
 * Create and start an enrichment job
 */
export async function startEnrichmentJob(
  request: EnrichmentJobRequest
): Promise<any> {
  try {
    // 1. Validate compliance
    if (!isRegionCompliant(request.region)) {
      throw new Error(
        `Enrichment not available in region: ${request.region}. GDPR/local restrictions apply.`
      );
    }

    // 2. Create job record
    const job = await prisma.enrichmentJob.create({
      data: {
        jobType: 'brand_contact_discovery',
        status: 'processing',
        brandId: request.brandId,
        brandName: request.brandName,
        brandWebsite: request.website,
        linkedInCompanyUrl: request.linkedInCompanyUrl,
        regionCode: request.region,
        complianceMode: true,
        rateLimitBucket: `enrichment:${request.userId}`,
        startedAt: new Date(),
      },
    });

    console.log(`[ENRICHMENT JOB] Started job ${job.id} for brand ${request.brandName}`);

    // Log job start
    await logDiscoveryStarted(
      job.id,
      request.brandId || 'unknown',
      request.brandName,
      request.userId,
      request.region
    );

    // 3. Discover contacts from multiple sources
    const linkedInContacts = await discoverContactsFromLinkedIn(
      request.brandName,
      request.linkedInCompanyUrl
    );

    const websiteContacts = request.website
      ? await discoverContactsFromWebsite(request.website)
      : [];

    // Merge and deduplicate
    const allContacts = deduplicateContacts([...linkedInContacts, ...websiteContacts]);

    console.log(`[ENRICHMENT JOB] Discovered ${allContacts.length} unique contacts`);

    // 4. Enrich contacts in database
    const enrichedContacts = await enrichDiscoveredContacts(
      allContacts,
      request.brandId
    );

    // Update job with contact count
    await prisma.enrichmentJob.update({
      where: { id: job.id },
      data: {
        contactsDiscovered: enrichedContacts.length,
      },
    });

    // 5. Generate emails for each contact
    let emailsGenerated = 0;
    for (const contact of enrichedContacts) {
      const domain = extractDomainFromUrl(request.website);
      if (!domain) continue;

      const result = await enrichContactWithEmails(
        contact.id,
        contact.firstName || '',
        contact.lastName || '',
        domain
      );

      if (result.emails.length > 0) {
        emailsGenerated += result.emails.length;
      }
    }

    // 6. Mark job complete
    const completedJob = await prisma.enrichmentJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        contactsEnriched: emailsGenerated,
        completedAt: new Date(),
      },
      include: {
        contacts: {
          include: {
            emails: true,
          },
        },
      },
    });

    console.log(
      `[ENRICHMENT JOB] Completed job ${job.id}: ${enrichedContacts.length} contacts, ${emailsGenerated} emails`
    );

    // Log job completion
    await logDiscoveryCompleted(
      job.id,
      request.brandId || 'unknown',
      request.brandName,
      request.userId,
      enrichedContacts.length,
      request.region
    );

    return {
      jobId: completedJob.id,
      status: 'completed',
      contactsDiscovered: completedJob.contactsDiscovered,
      contactsEnriched: completedJob.contactsEnriched,
      contacts: completedJob.contacts,
      complianceMessage: 'Data sourced from public information. Verify before outreach.',
    };
  } catch (error) {
    logError('[ENRICHMENT JOB] Enrichment failed:', error);

    // Mark job as failed
    if ((error as any).jobId) {
      await prisma.enrichmentJob.update({
        where: { id: (error as any).jobId },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
          completedAt: new Date(),
        },
      });
    }

    throw error;
  }
}

/**
 * Get enrichment job status
 */
export async function getEnrichmentJobStatus(jobId: string): Promise<any> {
  try {
    const job = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
      include: {
        contacts: {
          include: {
            emails: {
              select: {
                email: true,
                verificationStatus: true,
                verificationScore: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      jobId: job.id,
      status: job.status,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      contactsDiscovered: job.contactsDiscovered,
      contactsEnriched: job.contactsEnriched,
      contacts: job.contacts,
      errorMessage: job.errorMessage,
    };
  } catch (error) {
    logError('[ENRICHMENT JOB] Status check failed:', error);
    throw error;
  }
}

/**
 * Approve enriched contacts and create outreach entries
 */
export async function approveContactsForOutreach(
  jobId: string,
  contactIds: string[],
  userId: string
): Promise<any> {
  try {
    // Verify job belongs to user/brand
    const job = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Update contacts to approved
    const approvedContacts = await prisma.enrichedContact.updateMany({
      where: {
        id: { in: contactIds },
      },
      data: {
        verifiedAt: new Date(),
        addedToCrmAt: new Date(),
        activity: {
          push: {
            at: new Date().toISOString(),
            label: `Approved for outreach by ${userId}`,
          },
        },
      },
    });

    console.log(
      `[ENRICHMENT JOB] Approved ${approvedContacts.count} contacts for outreach`
    );

    return {
      jobId,
      approvedCount: approvedContacts.count,
      message: 'Contacts approved and ready for outreach sequences',
    };
  } catch (error) {
    logError('[ENRICHMENT JOB] Approval failed:', error);
    throw error;
  }
}

/**
 * Retry a failed enrichment job
 */
export async function retryEnrichmentJob(jobId: string): Promise<any> {
  try {
    const job = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error(`Max retries (${job.maxRetries}) exceeded`);
    }

    // Reset and retry
    const retried = await prisma.enrichmentJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        retryCount: job.retryCount + 1,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: null,
      },
    });

    return {
      jobId: retried.id,
      retryAttempt: retried.retryCount,
      maxRetries: retried.maxRetries,
      status: 'retrying',
    };
  } catch (error) {
    logError('[ENRICHMENT JOB] Retry failed:', error);
    throw error;
  }
}

/**
 * Deduplicate contacts by LinkedIn URL or name
 */
function deduplicateContacts(contacts: any[]): any[] {
  const seen = new Map<string, any>();

  for (const contact of contacts) {
    const key = contact.linkedInUrl || `${contact.firstName}_${contact.lastName}`;

    if (!seen.has(key)) {
      seen.set(key, contact);
    } else {
      // Keep the one with higher confidence score
      const existing = seen.get(key);
      if (contact.confidenceScore > existing.confidenceScore) {
        seen.set(key, contact);
      }
    }
  }

  return Array.from(seen.values());
}

export default {
  startEnrichmentJob,
  getEnrichmentJobStatus,
  approveContactsForOutreach,
  retryEnrichmentJob,
};

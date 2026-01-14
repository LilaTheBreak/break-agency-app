/**
 * Contact Enrichment API Routes
 * 
 * POST   /api/enrichment/discover         - Start a discovery job
 * GET    /api/enrichment/jobs/:id         - Get job status
 * POST   /api/enrichment/approve          - Approve contacts for outreach
 * GET    /api/enrichment/contacts         - List enriched contacts
 * DELETE /api/enrichment/contacts/:id     - Remove a contact
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin, isSuperAdmin } from '../lib/roleHelpers.js';
import { rateLimiters } from '../middleware/rateLimit.js';
import {
  startEnrichmentJob,
  getEnrichmentJobStatus,
  approveContactsForOutreach,
  retryEnrichmentJob,
} from '../services/enrichment/enrichmentOrchestrator.js';
import {
  isEnrichmentAllowedInRegion,
  checkUserEnrichmentPermission,
  validateApprovalBatch,
} from '../services/enrichment/complianceService.js';
import prisma from '../lib/prisma.js';
import { logError } from '../lib/logger.js';

const router = Router();

// All enrichment routes require auth
router.use(requireAuth);

// Require admin for enrichment features
router.use((req: Request, res: Response, next) => {
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
});

/**
 * POST /api/enrichment/discover
 * Start a brand contact discovery job
 */
router.post('/discover', rateLimiters.enrichmentDiscovery, async (req: Request, res: Response) => {
  try {
    const {
      brandId,
      brandName,
      website,
      linkedInCompanyUrl,
      region,
    } = req.body;

    if (!brandName?.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    // GDPR: Check region compliance
    const regionCheck = isEnrichmentAllowedInRegion(region);
    if (!regionCheck.allowed) {
      return res.status(451).json({
        error: 'Unavailable For Legal Reasons',
        message: regionCheck.reason,
        code: 'REGION_RESTRICTED',
      });
    }

    // GDPR: Check user permissions
    const permissionCheck = checkUserEnrichmentPermission(req.user, region);
    if (!permissionCheck.permitted) {
      return res.status(403).json({
        error: permissionCheck.reason,
        code: 'PERMISSION_DENIED',
      });
    }

    // Start enrichment job
    const result = await startEnrichmentJob({
      brandId,
      brandName: brandName.trim(),
      website,
      linkedInCompanyUrl,
      region,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      job: result,
      message: `Discovery started for ${brandName}. ${result.contactsDiscovered} contacts found.`,
      complianceNote: 'All data sourced from public information. Verify before outreach.',
    });
  } catch (error) {
    logError('[ENRICHMENT API] Discovery failed:', error);
    res.status(500).json({
      error: 'Discovery failed',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/enrichment/jobs/:jobId
 * Get enrichment job status
 */
router.get('/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const status = await getEnrichmentJobStatus(jobId);

    res.json({
      success: true,
      job: status,
    });
  } catch (error) {
    logError('[ENRICHMENT API] Status check failed:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/enrichment/approve
 * Approve contacts for outreach
 */
router.post('/approve', rateLimiters.enrichmentApproval, async (req: Request, res: Response) => {
  try {
    const { jobId, contactIds } = req.body;

    if (!jobId || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        error: 'jobId and contactIds array required',
      });
    }

    // Fetch contacts to validate compliance
    const contacts = await prisma.enrichedContact.findMany({
      where: { id: { in: contactIds } },
      include: { emails: true },
    });

    // Get job to retrieve region
    const job = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
    });

    // GDPR: Validate approval batch
    const batchValidation = validateApprovalBatch(contacts, job?.regionCode);
    if (batchValidation.blocked.length > 0) {
      return res.status(400).json({
        error: 'Compliance validation failed',
        message: 'Some contacts failed compliance checks and cannot be approved',
        blocked: batchValidation.blocked,
        warnings: batchValidation.warnings,
        code: 'COMPLIANCE_FAILED',
      });
    }

    const result = await approveContactsForOutreach(
      jobId,
      contactIds,
      req.user!.id
    );

    res.json({
      success: true,
      result,
      complianceNote: 'Approved contacts are ready for lawful B2B outreach. Verify accuracy before use.',
      warnings: batchValidation.warnings.length > 0 ? batchValidation.warnings : undefined,
    });
  } catch (error) {
    logError('[ENRICHMENT API] Approval failed:', error);
    res.status(500).json({
      error: 'Approval failed',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/enrichment/jobs/:jobId/retry
 * Retry a failed enrichment job
 */
router.post('/jobs/:jobId/retry', rateLimiters.enrichmentGeneral, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const result = await retryEnrichmentJob(jobId);

    res.json({
      success: true,
      job: result,
    });
  } catch (error) {
    logError('[ENRICHMENT API] Retry failed:', error);
    res.status(500).json({
      error: 'Retry failed',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/enrichment/contacts
 * List enriched contacts
 */
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const { brandId, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (brandId) {
      where.linkedBrandId = brandId as string;
    }

    const contacts = await prisma.enrichedContact.findMany({
      where,
      include: {
        emails: {
          select: {
            email: true,
            verificationStatus: true,
            verificationScore: true,
          },
        },
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { confidenceScore: 'desc' },
    });

    const total = await prisma.enrichedContact.count({ where });

    res.json({
      success: true,
      contacts,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    logError('[ENRICHMENT API] Contact list failed:', error);
    res.status(500).json({
      error: 'Failed to fetch contacts',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/enrichment/contacts/:contactId
 * Get enriched contact details
 */
router.get('/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    const contact = await prisma.enrichedContact.findUnique({
      where: { id: contactId },
      include: {
        emails: true,
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      success: true,
      contact,
    });
  } catch (error) {
    logError('[ENRICHMENT API] Contact fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch contact',
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/enrichment/contacts/:contactId
 * Remove an enriched contact
 */
router.delete('/contacts/:contactId', rateLimiters.enrichmentGeneral, async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    // Check if contact exists
    const contact = await prisma.enrichedContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Delete contact (cascade deletes emails)
    await prisma.enrichedContact.delete({
      where: { id: contactId },
    });

    res.json({
      success: true,
      message: 'Contact deleted',
    });
  } catch (error) {
    logError('[ENRICHMENT API] Contact deletion failed:', error);
    res.status(500).json({
      error: 'Failed to delete contact',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/enrichment/contacts/:contactId/link-to-crm
 * Link enriched contact to CRM contact
 */
router.post(
  '/contacts/:contactId/link-to-crm',
  rateLimiters.enrichmentApproval,
  async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      const { crmContactId } = req.body;

      if (!crmContactId) {
        return res.status(400).json({
          error: 'crmContactId required',
        });
      }

      // Verify CRM contact exists
      const crmContact = await prisma.crmBrandContact.findUnique({
        where: { id: crmContactId },
      });

      if (!crmContact) {
        return res.status(400).json({
          error: 'CRM contact not found',
        });
      }

      // Update enriched contact
      const updated = await prisma.enrichedContact.update({
        where: { id: contactId },
        data: {
          linkedContactId: crmContactId,
          addedToCrmAt: new Date(),
        },
      });

      res.json({
        success: true,
        contact: updated,
        message: 'Contact linked to CRM',
      });
    } catch (error) {
      logError('[ENRICHMENT API] Link failed:', error);
      res.status(500).json({
        error: 'Failed to link contact',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/enrichment/contacts/:contactId/save-to-crm
 * Save enriched contact to CRM (creates new CrmBrandContact)
 */
router.post(
  '/contacts/:contactId/save-to-crm',
  rateLimiters.enrichmentApproval,
  async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      const { brandId } = req.body;

      if (!brandId) {
        return res.status(400).json({
          error: 'brandId required',
        });
      }

      // Fetch enriched contact
      const enrichedContact = await prisma.enrichedContact.findUnique({
        where: { id: contactId },
        include: { emails: true },
      });

      if (!enrichedContact) {
        return res.status(404).json({
          error: 'Enriched contact not found',
        });
      }

      // Verify brand exists
      const brand = await prisma.crmBrand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        return res.status(404).json({
          error: 'Brand not found',
        });
      }

      // Get best verified email
      const bestEmail = enrichedContact.emails
        ?.filter(e => e.verificationStatus === 'verified')
        ?.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        ?.[0]
        ?.email;

      // Create CRM contact from enriched contact
      const crmContact = await prisma.crmBrandContact.create({
        data: {
          id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          crmBrandId: brandId,
          firstName: enrichedContact.firstName || '',
          lastName: enrichedContact.lastName || '',
          email: bestEmail || null,
          title: enrichedContact.jobTitle || null,
          linkedInUrl: enrichedContact.linkedInUrl || null,
          relationshipStatus: 'New',
          notes: `Auto-created from enrichment. Source: ${enrichedContact.source}. Confidence: ${enrichedContact.confidenceScore}%`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          CrmBrand: {
            select: {
              id: true,
              brandName: true,
              status: true,
            },
          },
        },
      });

      // Link enriched contact to CRM contact
      const updated = await prisma.enrichedContact.update({
        where: { id: contactId },
        data: {
          linkedContactId: crmContact.id,
          linkedBrandId: brandId,
          addedToCrmAt: new Date(),
        },
      });

      res.json({
        success: true,
        contact: crmContact,
        enrichedContact: updated,
        message: 'Contact saved to CRM successfully',
      });
    } catch (error) {
      logError('[ENRICHMENT API] Save to CRM failed:', error);
      res.status(500).json({
        error: 'Failed to save contact to CRM',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * GET /api/enrichment/stats
 * Get enrichment statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalDiscovered = await prisma.enrichedContact.count();
    const totalVerified = await prisma.enrichedContact.count({
      where: { verifiedAt: { not: null } },
    });
    const totalEmails = await prisma.contactEmail.count();
    const verifiedEmails = await prisma.contactEmail.count({
      where: { verificationStatus: 'verified' },
    });
    const jobsCompleted = await prisma.enrichmentJob.count({
      where: { status: 'completed' },
    });
    const jobsFailed = await prisma.enrichmentJob.count({
      where: { status: 'failed' },
    });

    res.json({
      success: true,
      stats: {
        contacts: {
          total: totalDiscovered,
          verified: totalVerified,
          percentage: totalDiscovered > 0 ? Math.round((totalVerified / totalDiscovered) * 100) : 0,
        },
        emails: {
          total: totalEmails,
          verified: verifiedEmails,
          percentage: totalEmails > 0 ? Math.round((verifiedEmails / totalEmails) * 100) : 0,
        },
        jobs: {
          completed: jobsCompleted,
          failed: jobsFailed,
        },
      },
    });
  } catch (error) {
    logError('[ENRICHMENT API] Stats failed:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: (error as Error).message,
    });
  }
});

export default router;

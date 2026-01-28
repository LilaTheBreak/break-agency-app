import express from 'express';
import { DealStage } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { logError } from '../lib/logger.js';
import prisma from '../lib/prisma.js';
import { sendList, sendEmptyList, sendSuccess, sendError, handleApiError } from '../utils/apiResponse.js';
import { validateRequestSafe, OpportunityCreateSchema, OpportunityUpdateSchema } from '../utils/validationSchemas.js';
import * as Sentry from '@sentry/node';

const router = express.Router();

// Get all active opportunities (public)
router.get('/public', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    sendList(res, opportunities || []);
  } catch (error) {
    logError('Error fetching public opportunities', error);
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/public', method: 'GET' },
    });
    sendEmptyList(res);
  }
});

// Get all opportunities (admin only)
router.get('/', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        OpportunityApplication: {
          select: {
            id: true,
            creatorId: true,
            status: true,
            appliedAt: true
          }
        }
      }
    });
    sendList(res, opportunities || []);
  } catch (error) {
    logError('Error fetching opportunities', error, { userId: req.user?.id });
    // Return empty list on error - graceful degradation
    sendEmptyList(res);
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id }
    });
    
    if (!opportunity) {
      return sendError(res, "NOT_FOUND", "Opportunity not found", 404);
    }
    
    sendSuccess(res, opportunity);
  } catch (error) {
    logError('Error fetching opportunity', error, { opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch opportunity', 'OPPORTUNITY_FETCH_FAILED');
  }
});

// Create opportunity (admin only)
router.post('/', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    // Validate request body
    const validation = validateRequestSafe(OpportunityCreateSchema, req.body);
    if (!validation.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, (validation as any).error.format());
    }

    const { title, description, brandId, isActive, deadline, payment } = validation.data;
    const createdBy = req.user?.id || 'system';

    // Generate unique ID for opportunity
    const opportunityId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Map validated data to Prisma schema (handle legacy fields)
    // Note: Schema requires non-null strings for brand, location, deliverables, payment, deadline, image, logo, type
    const opportunity = await prisma.opportunity.create({
      data: {
        id: opportunityId,
        title,
        brand: req.body.brand || '', // Required field - use empty string if not provided
        location: req.body.location || '', // Required field - use empty string if not provided
        deliverables: req.body.deliverables || '', // Required field - use empty string if not provided
        payment: payment ? String(payment) : (req.body.payment ? String(req.body.payment) : ''), // Required field - convert to string
        deadline: deadline ? new Date(deadline).toISOString() : (req.body.deadline ? new Date(req.body.deadline).toISOString() : ''), // Required field - convert to ISO string
        status: req.body.status || 'Live brief · Login required to apply',
        image: req.body.image || '', // Required field - use empty string if not provided
        logo: req.body.logo || '', // Required field - use empty string if not provided
        type: req.body.type || '', // Required field - use empty string if not provided
        isActive: isActive !== undefined ? isActive : true,
        createdBy,
        updatedAt: new Date()
      }
    });

    sendSuccess(res, opportunity, 201);
  } catch (error) {
    logError('Error creating opportunity', error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities', method: 'POST' },
    });
    handleApiError(res, error, 'Failed to create opportunity', 'OPPORTUNITY_CREATE_FAILED');
  }
});

// Update opportunity (admin only)
router.put('/:id', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validation = validateRequestSafe(OpportunityUpdateSchema, req.body);
    if (!validation.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, (validation as any).error.format());
    }

    const { title, description, isActive, deadline, payment } = validation.data;

    // Map validated data to Prisma schema (handle legacy fields)
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(deadline && { deadline: new Date(deadline).toISOString() }), // Convert to ISO string (schema expects String)
        ...(payment && { payment: String(payment) }), // Convert to string (schema expects String)
        // Legacy fields (preserve if provided)
        ...(req.body.brand && { brand: req.body.brand }),
        ...(req.body.location && { location: req.body.location }),
        ...(req.body.deliverables && { deliverables: req.body.deliverables }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.image && { image: req.body.image }),
        ...(req.body.logo && { logo: req.body.logo }),
        ...(req.body.type && { type: req.body.type }),
      }
    });

    sendSuccess(res, opportunity);
  } catch (error) {
    logError('Error updating opportunity', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id', method: 'PUT' },
    });
    handleApiError(res, error, 'Failed to update opportunity', 'OPPORTUNITY_UPDATE_FAILED');
  }
});

// Delete opportunity (admin only)
router.delete('/:id', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.opportunity.delete({
      where: { id }
    });

    sendSuccess(res, { message: 'Opportunity deleted successfully' });
  } catch (error) {
    logError('Error deleting opportunity', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id', method: 'DELETE' },
    });
    handleApiError(res, error, 'Failed to delete opportunity', 'OPPORTUNITY_DELETE_FAILED');
  }
});

// GET /api/opportunities/creator - Get opportunities for creator with their application status
router.get('/creator/all', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      include: {
        OpportunityApplication: {
          where: { creatorId: userId },
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
        },
        Submission: {
          where: { creatorId: userId },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include application status
    const opportunitiesWithStatus = opportunities.map((opp) => ({
      ...opp,
      applicationStatus: opp.OpportunityApplication[0]?.status || null,
      hasSubmission: opp.Submission.length > 0,
    }));

    sendSuccess(res, { opportunities: opportunitiesWithStatus });
  } catch (error) {
    logError('Error fetching creator opportunities', error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/creator/all', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch opportunities', 'OPPORTUNITY_CREATOR_FETCH_FAILED');
  }
});

// POST /api/opportunities/:id/apply - Apply to an opportunity
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { pitch, proposedRate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (!opportunity.isActive) {
      return res.status(400).json({ error: 'Opportunity is no longer active' });
    }

    // Check if already applied
    const existingApplication = await prisma.opportunityApplication.findUnique({
      where: {
        opportunityId_creatorId: {
          opportunityId: id,
          creatorId: userId,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this opportunity' });
    }

    const application = await prisma.opportunityApplication.create({
      data: {
        id: `app_${id}_${userId}_${Date.now()}`,
        opportunityId: id,
        creatorId: userId,
        status: 'shortlisted',
        pitch: pitch || '',
        proposedRate: proposedRate || null,
      },
      include: {
        Opportunity: true,
      },
    });

    sendSuccess(res, { application }, 201);
  } catch (error) {
    logError('Error applying to opportunity', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id/apply', method: 'POST' },
    });
    handleApiError(res, error, 'Failed to apply to opportunity', 'OPPORTUNITY_APPLY_FAILED');
  }
});

// GET /api/opportunities/:id/application - Get user's application for an opportunity
router.get('/:id/application', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const application = await prisma.opportunityApplication.findUnique({
      where: {
        opportunityId_creatorId: {
          opportunityId: id,
          creatorId: userId,
        },
      },
      include: {
        Opportunity: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    sendSuccess(res, { application });
  } catch (error) {
    logError('Error fetching application', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id/application', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch application', 'APPLICATION_FETCH_FAILED');
  }
});

// ===== ADMIN ENDPOINTS =====

// GET /api/opportunities/admin/applications - Get all applications for admin review
router.get('/admin/applications', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req, res) => {
  try {
    const { status, opportunityId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (opportunityId) where.opportunityId = opportunityId;

    const applications = await prisma.opportunityApplication.findMany({
      where,
      include: {
        Opportunity: {
          select: {
            id: true,
            title: true,
            brand: true,
            payment: true,
            deadline: true,
            status: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            Talent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    sendSuccess(res, { applications });
  } catch (error) {
    logError('Error fetching applications', error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/admin/applications', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch applications', 'APPLICATIONS_FETCH_FAILED');
  }
});

// PATCH /api/opportunities/admin/applications/:id - Update application status (admin only)
router.patch('/admin/applications/:id', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'shortlisted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await prisma.opportunityApplication.update({
      where: { id },
      data: {
        status,
        notes,
        reviewedAt: new Date(),
      },
      include: {
        Opportunity: true,
        User: {
          include: {
            Talent: true,
          },
        },
      },
    });

    // If approved, auto-create deal
    if (status === 'approved') {
      await createDealFromApplication(application);
    }

    sendSuccess(res, { application });
  } catch (error) {
    logError('Error updating application', error, { userId: req.user?.id, applicationId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/admin/applications/:id', method: 'PATCH' },
    });
    handleApiError(res, error, 'Failed to update application', 'APPLICATION_UPDATE_FAILED');
  }
});

// PATCH /api/opportunities/:id/status - Update opportunity status (admin only)
router.patch('/:id/status', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, { opportunity });
  } catch (error) {
    logError('Error updating opportunity status', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id/status', method: 'PATCH' },
    });
    handleApiError(res, error, 'Failed to update opportunity status', 'OPPORTUNITY_STATUS_UPDATE_FAILED');
  }
});

/**
 * Helper function to auto-create deal from approved application
 */
async function createDealFromApplication(application: any) {
  try {
    const userId = application.creatorId;
    const opportunity = application.opportunity;

    // Get or create brand
    let brand = await prisma.brand.findFirst({
      where: { name: opportunity.brand },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          id: `brand-${Date.now()}`,
          name: opportunity.brand,
          values: [],
          restrictedCategories: [],
          preferredCreatorTypes: [],
        },
      });
    }

    // Get user's talent profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Talent: true },
    });

    if (!user?.Talent) {
      throw new Error('User does not have a talent profile');
    }

    // Parse payment to extract value
    const paymentMatch = opportunity.payment.match(/[\d,]+/);
    const value = paymentMatch ? parseFloat(paymentMatch[0].replace(/,/g, '')) : 0;

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        id: `deal-${Date.now()}-${userId}`,
        userId: userId,
        talentId: user.Talent.id,
        brandId: brand.id,
        brandName: brand.name,
        stage: DealStage.NEW_LEAD,
        value: value,
        currency: 'USD',
        notes: `Auto-created from opportunity: ${opportunity.title}\n\nCreator pitch: ${application.pitch || 'N/A'}\nProposed rate: ${application.proposedRate ? `$${application.proposedRate}` : 'N/A'}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create timeline entry
    await prisma.dealTimeline.create({
      data: {
        id: `timeline-${Date.now()}`,
        dealId: deal.id,
        createdById: userId,
        type: 'DEAL_CREATED',
        message: `Deal created from approved application to opportunity: ${opportunity.title}`,
        metadata: {
          opportunityId: opportunity.id,
          applicationId: application.id,
          source: 'marketplace',
        },
      },
    });

    console.log(`[OPPORTUNITIES] Auto-created deal ${deal.id} from application ${application.id}`);
    return deal;
  } catch (error) {
    console.error('[OPPORTUNITIES] Error creating deal from application:', error);
    // Don't throw - application approval should still succeed
  }
}

// ============================================
// EMAIL-SOURCED OPPORTUNITIES (NEW)
// ============================================

import {
  getInboxDetectedOpportunities,
  approveOpportunity,
  dismissOpportunity,
  createOpportunityFromEmail,
} from '../services/opportunityFromEmailService.js';
import { classifyEmailForOpportunity } from '../lib/emailIntelligence.js';

/**
 * GET /api/opportunities/by-email/:emailId
 * Get opportunity for a specific email (if exists)
 * Public endpoint - allows inbox to check for opportunities
 */
router.get('/by-email/:emailId', requireAuth, async (req, res) => {
  try {
    const { emailId } = req.params;
    
    const opportunity = await prisma.opportunity.findFirst({
      where: { sourceEmailId: emailId },
    });

    if (!opportunity) {
      return sendError(res, "NOT_FOUND", "No opportunity found for this email", 404);
    }

    sendSuccess(res, opportunity);
  } catch (error) {
    logError('Error fetching opportunity by email', error, { userId: req.user?.id, emailId: req.params.emailId });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/by-email/:emailId', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch opportunity', 'OPPORTUNITY_BY_EMAIL_FAILED');
  }
});

/**
 * GET /api/opportunities/inbox-detected
 * Get all opportunities detected from inbox emails
 * Requires: deals:read permission
 */
router.get('/inbox-detected', requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { minConfidence, status } = req.query;
    
    const filters = {
      minConfidence: minConfidence ? parseFloat(minConfidence as string) : 0,
      status: (status as string) || 'unreviewed',
    };

    const opportunities = await getInboxDetectedOpportunities(filters);
    
    sendList(res, opportunities);
  } catch (error) {
    logError('Error fetching inbox-detected opportunities', error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/inbox-detected', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch inbox opportunities', 'INBOX_OPPORTUNITIES_FETCH_FAILED');
  }
});

/**
 * POST /api/opportunities/from-email
 * Manually create an opportunity from a specific email
 * Requires: deals:write permission
 */
router.post('/from-email', requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { emailId } = req.body;
    
    if (!emailId) {
      return sendError(res, "VALIDATION_ERROR", "emailId is required", 400);
    }

    // Fetch email
    const email = await prisma.inboundEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return sendError(res, "NOT_FOUND", "Email not found", 404);
    }

    // Classify email
    const classification = classifyEmailForOpportunity(email);

    if (!classification.isDealRelated) {
      return sendError(res, "VALIDATION_ERROR", "Email is not classified as deal-related", 400, {
        classification,
      });
    }

    // Create opportunity
    const opportunity = await createOpportunityFromEmail(email, classification);

    if (!opportunity) {
      return sendError(res, "CONFLICT", "Opportunity already exists for this email", 409);
    }

    sendSuccess(res, opportunity, 201);
  } catch (error) {
    logError('Error creating opportunity from email', error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/from-email', method: 'POST' },
    });
    handleApiError(res, error, 'Failed to create opportunity from email', 'OPPORTUNITY_FROM_EMAIL_FAILED');
  }
});

/**
 * PATCH /api/opportunities/:id/approve
 * Approve an inbox-detected opportunity
 * Requires: deals:write permission
 */
router.patch('/:id/approve', requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body || {};

    const opportunity = await approveOpportunity(id, userId, updates);

    sendSuccess(res, opportunity);
  } catch (error) {
    logError('Error approving opportunity', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id/approve', method: 'PATCH' },
    });
    handleApiError(res, error, 'Failed to approve opportunity', 'OPPORTUNITY_APPROVE_FAILED');
  }
});

/**
 * PATCH /api/opportunities/:id/dismiss
 * Dismiss an inbox-detected opportunity (false positive)
 * Requires: deals:write permission
 */
router.patch('/:id/dismiss', requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { reason } = req.body;

    const opportunity = await dismissOpportunity(id, userId, reason);

    sendSuccess(res, opportunity);
  } catch (error) {
    logError('Error dismissing opportunity', error, { userId: req.user?.id, opportunityId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/opportunities/:id/dismiss', method: 'PATCH' },
    });
    handleApiError(res, error, 'Failed to dismiss opportunity', 'OPPORTUNITY_DISMISS_FAILED');
  }
});

export default router;

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';
import { logAdminActivity } from '../../lib/adminActivityLogger.js';
import { logDestructiveAction } from '../../lib/auditLogger.js';
import { logError } from '../../lib/logger.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import {
  calculateOutreachMetrics,
  getStageMetrics,
} from '../../services/outreachMetricsService.js';
import {
  updateStageBasedOnGmail,
  markAsReplied,
  scheduleFollowUp,
  getOverdueFollowUps,
  autoSyncAllOutreach,
} from '../../services/outreachGmailService.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/outreach
 * Get all outreach records with optional filtering
 * 
 * Query params:
 * - archived: Filter by archived status (true/false)
 * - stage: Filter by stage
 * - createdBy: Filter by creator
 * - linkedBrandId: Filter by brand
 * - search: Search in contact name or email
 * 
 * Returns: [ { id, target, type, contact, contactEmail, stage, status, ... } ]
 */
router.get('/outreach', async (req: Request, res: Response) => {
  try {
    const { archived, stage, createdBy, linkedBrandId, search } = req.query;
    const userId = req.user?.id;

    console.log('[OUTREACH_LIST] Fetching outreach:', { archived, stage, createdBy, linkedBrandId, search });

    const where: any = {};

    if (archived !== undefined) {
      where.archived = archived === 'true';
    }

    if (stage && typeof stage === 'string') {
      where.stage = stage;
    }

    if (createdBy && typeof createdBy === 'string') {
      where.createdBy = createdBy;
    }

    if (linkedBrandId && typeof linkedBrandId === 'string') {
      where.linkedBrandId = linkedBrandId;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { contact: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { target: { contains: search, mode: 'insensitive' } },
      ];
    }

    const outreach = await prisma.outreach.findMany({
      where,
      include: {
        User_Outreach_createdByToUser: {
          select: { id: true, name: true, email: true },
        },
        Brand: {
          select: { id: true, name: true },
        },
        OutreachEmailThread: true,
        OutreachNote: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        OutreachTask: {
          where: { status: { not: 'Completed' } },
        },
        SalesOpportunity: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[OUTREACH_LIST] Found', outreach.length, 'records');

    return sendSuccess(res, outreach, 200, 'Outreach records retrieved');
  } catch (error) {
    console.error('[OUTREACH_LIST] Error:', error);
    logError('Failed to fetch outreach records', error, { userId: req.user?.id });
    return sendError(res, 'OUTREACH_FETCH_FAILED', 'Failed to fetch outreach records', 500);
  }
});

/**
 * GET /api/outreach/:id
 * Get a single outreach record with full details
 */
router.get('/outreach/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const outreach = await prisma.outreach.findUnique({
      where: { id },
      include: {
        User_Outreach_createdByToUser: {
          select: { id: true, name: true, email: true },
        },
        Brand: {
          select: { id: true, name: true },
        },
        OutreachEmailThread: {
          orderBy: { createdAt: 'desc' },
        },
        OutreachNote: {
          orderBy: { createdAt: 'desc' },
        },
        OutreachTask: {
          orderBy: { createdAt: 'desc' },
        },
        SalesOpportunity: {
          include: {
            Deal: {
              select: { id: true, stage: true, value: true },
            },
          },
        },
      },
    });

    if (!outreach) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    return sendSuccess(res, outreach, 200, 'Outreach record retrieved');
  } catch (error) {
    console.error('[OUTREACH_GET] Error:', error);
    logError('Failed to fetch outreach record', error, { userId: req.user?.id });
    return sendError(res, 'OUTREACH_FETCH_FAILED', 'Failed to fetch outreach record', 500);
  }
});

/**
 * POST /api/outreach
 * Create a new outreach record
 * 
 * Body:
 * {
 *   target: string (required) - Company/person name
 *   type: string (default: "Brand")
 *   contact?: string - Contact person name
 *   contactEmail?: string - Contact email
 *   link?: string - LinkedIn/contact profile URL
 *   owner?: string - Owner name
 *   source?: string - Source (LinkedIn, Email, Referral, etc.)
 *   linkedBrandId?: string - Link to brand in system
 * }
 */
router.post('/outreach', async (req: Request, res: Response) => {
  try {
    const { target, type = 'Brand', contact, contactEmail, link, owner, source, linkedBrandId } = req.body;
    const userId = req.user?.id;

    if (!target) {
      return sendError(res, 'VALIDATION_ERROR', 'target is required', 400);
    }

    console.log('[OUTREACH_CREATE] Creating outreach:', { target, contact });

    const outreach = await prisma.outreach.create({
      data: {
        id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        target,
        type,
        contact,
        contactEmail,
        link,
        owner,
        source,
        linkedBrandId,
        createdBy: userId!,
        updatedAt: new Date(),
      },
      include: {
        User_Outreach_createdByToUser: {
          select: { id: true, name: true, email: true },
        },
        Brand: true,
      },
    });

    await logAdminActivity(req as any, { action: 'CREATE_OUTREACH', metadata: { outreachId: outreach.id, target } });

    console.log('[OUTREACH_CREATE] Created:', outreach.id);

    return sendSuccess(res, outreach, 201, 'Outreach record created');
  } catch (error) {
    console.error('[OUTREACH_CREATE] Error:', error);
    logError('Failed to create outreach record', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_CREATE_FAILED',
      error instanceof Error ? error.message : 'Failed to create outreach record',
      500
    );
  }
});

/**
 * PUT /api/outreach/:id
 * Update an outreach record
 */
router.put('/outreach/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target, type, contact, contactEmail, link, owner, source, linkedBrandId, archived } = req.body;
    const userId = req.user?.id;

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    console.log('[OUTREACH_UPDATE] Updating:', id);

    const updated = await prisma.outreach.update({
      where: { id },
      data: {
        ...(target && { target }),
        ...(type && { type }),
        ...(contact !== undefined && { contact }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(link !== undefined && { link }),
        ...(owner !== undefined && { owner }),
        ...(source !== undefined && { source }),
        ...(linkedBrandId !== undefined && { linkedBrandId }),
        ...(archived !== undefined && { archived }),
        updatedAt: new Date(),
      },
      include: {
        User_Outreach_createdByToUser: {
          select: { id: true, name: true, email: true },
        },
        Brand: true,
      },
    });

    await logAdminActivity(req as any, { action: 'UPDATE_OUTREACH', metadata: { outreachId: id } });

    return sendSuccess(res, updated, 200, 'Outreach record updated');
  } catch (error) {
    console.error('[OUTREACH_UPDATE] Error:', error);
    logError('Failed to update outreach record', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_UPDATE_FAILED',
      error instanceof Error ? error.message : 'Failed to update outreach record',
      500
    );
  }
});

/**
 * DELETE /api/outreach/:id
 * Delete an outreach record (soft delete via archived flag)
 */
router.delete('/outreach/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    console.log('[OUTREACH_DELETE] Archiving:', id);

    const deleted = await prisma.outreach.update({
      where: { id },
      data: { archived: true, updatedAt: new Date() },
    });

    await logAdminActivity(req as any, { action: 'DELETE_OUTREACH', metadata: { outreachId: id } });
    await logDestructiveAction(req as any, { action: 'DELETE_OUTREACH', metadata: { outreachId: id } });

    return sendSuccess(res, deleted, 200, 'Outreach record archived');
  } catch (error) {
    console.error('[OUTREACH_DELETE] Error:', error);
    logError('Failed to delete outreach record', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_DELETE_FAILED',
      error instanceof Error ? error.message : 'Failed to delete outreach record',
      500
    );
  }
});

/**
 * PATCH /api/outreach/:id/stage
 * Update the stage of an outreach record
 * 
 * Body: { stage: string }
 * Valid stages: not_started, awaiting_reply, replied, qualified, meeting_scheduled, closed
 */
router.patch('/outreach/:id/stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const userId = req.user?.id;

    if (!stage) {
      return sendError(res, 'VALIDATION_ERROR', 'stage is required', 400);
    }

    const validStages = ['not_started', 'awaiting_reply', 'replied', 'qualified', 'meeting_scheduled', 'closed'];
    if (!validStages.includes(stage)) {
      return sendError(res, 'VALIDATION_ERROR', `Invalid stage. Valid stages: ${validStages.join(', ')}`, 400);
    }

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    console.log('[OUTREACH_STAGE] Updating stage:', id, '->', stage);

    const updated = await prisma.outreach.update({
      where: { id },
      data: {
        stage,
        status: `Stage changed to ${stage}`,
        updatedAt: new Date(),
      },
    });

    await logAdminActivity(req as any, { action: 'UPDATE_OUTREACH_STAGE', metadata: { outreachId: id, newStage: stage } });

    return sendSuccess(res, updated, 200, 'Stage updated');
  } catch (error) {
    console.error('[OUTREACH_STAGE] Error:', error);
    logError('Failed to update outreach stage', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_STAGE_UPDATE_FAILED',
      error instanceof Error ? error.message : 'Failed to update stage',
      500
    );
  }
});

/**
 * POST /api/outreach/:id/mark-replied
 * Mark an outreach as having received a reply
 * Automatically updates stage based on Gmail activity
 * 
 * Body: { emailCount?: number }
 */
router.post('/outreach/:id/mark-replied', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { emailCount = 1 } = req.body;
    const userId = req.user?.id;

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    console.log('[OUTREACH_REPLY] Marking as replied:', id);

    const updated = await markAsReplied(id, emailCount);

    await logAdminActivity(req as any, { action: 'MARK_OUTREACH_REPLIED', metadata: { outreachId: id } });

    return sendSuccess(res, updated, 200, 'Marked as replied and stage updated');
  } catch (error) {
    console.error('[OUTREACH_REPLY] Error:', error);
    logError('Failed to mark outreach as replied', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_REPLY_FAILED',
      error instanceof Error ? error.message : 'Failed to mark as replied',
      500
    );
  }
});

/**
 * POST /api/outreach/:id/schedule-followup
 * Schedule a follow-up for an outreach record
 * 
 * Body: { daysFromNow?: number }
 */
router.post('/outreach/:id/schedule-followup', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { daysFromNow = 3 } = req.body;
    const userId = req.user?.id;

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    console.log('[OUTREACH_FOLLOWUP] Scheduling for:', id);

    const followUpDate = await scheduleFollowUp(id, daysFromNow);
    const updated = await prisma.outreach.findUnique({ where: { id } });

    await logAdminActivity(req as any, { action: 'SCHEDULE_OUTREACH_FOLLOWUP', metadata: { outreachId: id, daysFromNow } });

    return sendSuccess(res, { ...updated, nextFollowUp: followUpDate }, 200, 'Follow-up scheduled');
  } catch (error) {
    console.error('[OUTREACH_FOLLOWUP] Error:', error);
    logError('Failed to schedule follow-up', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_FOLLOWUP_FAILED',
      error instanceof Error ? error.message : 'Failed to schedule follow-up',
      500
    );
  }
});

/**
 * GET /api/outreach/metrics/dashboard
 * Get overall outreach metrics
 */
router.get('/outreach/metrics/dashboard', async (req: Request, res: Response) => {
  try {
    const { createdBy, linkedBrandId } = req.query;

    console.log('[OUTREACH_METRICS] Fetching metrics');

    const metrics = await calculateOutreachMetrics({
      ...(createdBy && { createdBy: createdBy as string }),
      ...(linkedBrandId && { linkedBrandId: linkedBrandId as string }),
      archived: false,
    });

    return sendSuccess(res, metrics, 200, 'Metrics retrieved');
  } catch (error) {
    console.error('[OUTREACH_METRICS] Error:', error);
    logError('Failed to calculate metrics', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_METRICS_FAILED',
      error instanceof Error ? error.message : 'Failed to calculate metrics',
      500
    );
  }
});

/**
 * GET /api/outreach/metrics/stage/:stage
 * Get metrics for a specific stage
 */
router.get('/outreach/metrics/stage/:stage', async (req: Request, res: Response) => {
  try {
    const { stage } = req.params;

    const metrics = await getStageMetrics(stage);

    return sendSuccess(res, metrics, 200, 'Stage metrics retrieved');
  } catch (error) {
    console.error('[OUTREACH_STAGE_METRICS] Error:', error);
    logError('Failed to get stage metrics', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_STAGE_METRICS_FAILED',
      error instanceof Error ? error.message : 'Failed to get stage metrics',
      500
    );
  }
});

/**
 * POST /api/outreach/:id/add-note
 * Add a note to an outreach record
 * 
 * Body: { body: string }
 */
router.post('/outreach/:id/add-note', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = req.user?.id;

    if (!body) {
      return sendError(res, 'VALIDATION_ERROR', 'body is required', 400);
    }

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    const note = await prisma.outreachNote.create({
      data: {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outreachId: id,
        author: userId!,
        body,
        createdAt: new Date(),
      },
    });

    await logAdminActivity(req as any, { action: 'ADD_OUTREACH_NOTE', metadata: { outreachId: id } });

    return sendSuccess(res, note, 201, 'Note added');
  } catch (error) {
    console.error('[OUTREACH_NOTE] Error:', error);
    logError('Failed to add note', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_NOTE_FAILED',
      error instanceof Error ? error.message : 'Failed to add note',
      500
    );
  }
});

/**
 * POST /api/outreach/:id/create-task
 * Create a task for an outreach record
 * 
 * Body: { title: string, dueDate?: string, priority?: string, owner?: string }
 */
router.post('/outreach/:id/create-task', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, dueDate, priority = 'Medium', owner } = req.body;
    const userId = req.user?.id;

    if (!title) {
      return sendError(res, 'VALIDATION_ERROR', 'title is required', 400);
    }

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    const task = await prisma.outreachTask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outreachId: id,
        title,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        owner,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await logAdminActivity(req as any, { action: 'CREATE_OUTREACH_TASK', metadata: { outreachId: id, taskId: task.id } });

    return sendSuccess(res, task, 201, 'Task created');
  } catch (error) {
    console.error('[OUTREACH_TASK] Error:', error);
    logError('Failed to create task', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_TASK_FAILED',
      error instanceof Error ? error.message : 'Failed to create task',
      500
    );
  }
});

/**
 * POST /api/outreach/:id/convert-to-opportunity
 * Convert an outreach record to a sales opportunity
 * 
 * Body: { opportunityName: string, stage?: string }
 */
router.post('/outreach/:id/convert-to-opportunity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { opportunityName, stage = 'qualification' } = req.body;
    const userId = req.user?.id;

    if (!opportunityName) {
      return sendError(res, 'VALIDATION_ERROR', 'opportunityName is required', 400);
    }

    const outreach = await prisma.outreach.findUnique({ where: { id } });
    if (!outreach) {
      return sendError(res, 'NOT_FOUND', 'Outreach record not found', 404);
    }

    console.log('[OUTREACH_CONVERT] Converting to opportunity:', id);

    // Check if opportunity already exists
    let opportunity = await prisma.salesOpportunity.findFirst({
      where: { outreachId: id },
    });

    if (!opportunity) {
      opportunity = await prisma.salesOpportunity.create({
        data: {
          id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          Outreach: { connect: { id } },
          name: opportunityName,
          value: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Update outreach with opportunity reference
    const updated = await prisma.outreach.update({
      where: { id },
      data: {
        opportunityRef: opportunity.id,
        stage: 'qualified',
        status: 'Converted to opportunity',
        updatedAt: new Date(),
      },
      include: {
        SalesOpportunity: true,
      },
    });

    await logAdminActivity(req as any, { action: 'CONVERT_OUTREACH_TO_OPPORTUNITY', metadata: { outreachId: id, opportunityId: opportunity.id } });

    return sendSuccess(res, { outreach: updated, opportunity }, 200, 'Converted to opportunity');
  } catch (error) {
    console.error('[OUTREACH_CONVERT] Error:', error);
    logError('Failed to convert to opportunity', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_CONVERT_FAILED',
      error instanceof Error ? error.message : 'Failed to convert to opportunity',
      500
    );
  }
});

/**
 * POST /api/outreach/sync-all
 * Trigger auto-sync of all outreach records with Gmail status
 * This would typically be called by a cron job
 */
router.post('/outreach/sync-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    console.log('[OUTREACH_SYNC_ALL] Starting sync');

    const result = await autoSyncAllOutreach();

    await logAdminActivity(req as any, { action: 'SYNC_ALL_OUTREACH', metadata: result });

    console.log('[OUTREACH_SYNC_ALL] Completed:', result);

    return sendSuccess(res, result, 200, 'Sync completed');
  } catch (error) {
    console.error('[OUTREACH_SYNC_ALL] Error:', error);
    logError('Failed to sync outreach', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_SYNC_FAILED',
      error instanceof Error ? error.message : 'Failed to sync outreach',
      500
    );
  }
});

/**
 * GET /api/outreach/overdue-followups
 * Get all overdue follow-ups for batch processing
 */
router.get('/outreach/overdue-followups', async (req: Request, res: Response) => {
  try {
    const followUps = await getOverdueFollowUps();

    return sendSuccess(res, followUps, 200, 'Overdue follow-ups retrieved');
  } catch (error) {
    console.error('[OUTREACH_OVERDUE] Error:', error);
    logError('Failed to fetch overdue follow-ups', error, { userId: req.user?.id });
    return sendError(
      res,
      'OUTREACH_OVERDUE_FAILED',
      error instanceof Error ? error.message : 'Failed to fetch overdue follow-ups',
      500
    );
  }
});

export { router };

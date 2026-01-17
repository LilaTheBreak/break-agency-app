import express, { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { logInfo, logError } from '../../lib/logger.js';
import * as aiIntelligence from '../../services/aiIntelligenceService.js';
import * as reminderEngine from '../../services/reminderEngineService.js';
import * as briefGenerator from '../../services/briefGenerationService.js';
import * as overloadDetection from '../../services/overloadDetectionService.js';
import * as talentAvailability from '../../services/talentAvailabilityService.js';
import * as agendaGeneration from '../../services/agendaGenerationService.js';

const router = express.Router();

// Apply auth to all routes
router.use(requireAuth);

// ============================================================================
// SMART REMINDERS ENDPOINTS
// ============================================================================

/**
 * GET /api/intelligence/reminders?talentId=:talentId
 * Get pending reminders for talent
 */
router.get('/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    const reminders = await reminderEngine.getPendingReminders(talentId);

    res.json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (err) {
    logError('[API] Error fetching reminders', err);
    next(err);
  }
});

/**
 * POST /api/intelligence/reminders/generate?talentId=:talentId
 * Generate smart reminders for talent (AI analysis of all context)
 */
router.post('/reminders/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    logInfo('[API] Generating reminders', { talentId });

    const createdReminders = await reminderEngine.generateSmartReminders(talentId);

    res.json({
      success: true,
      message: `Generated ${createdReminders.length} reminder(s)`,
      reminderIds: createdReminders,
    });
  } catch (err) {
    logError('[API] Error generating reminders', err);
    next(err);
  }
});

/**
 * GET /api/intelligence/reminders/:reminderId
 * Get reminder details
 */
router.get('/reminders/:reminderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reminderId } = req.params;

    const reminder = await reminderEngine.getReminderDetails(reminderId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({
      success: true,
      data: reminder,
    });
  } catch (err) {
    logError('[API] Error fetching reminder', err);
    next(err);
  }
});

/**
 * POST /api/intelligence/reminders/:reminderId/accept
 * Accept a reminder suggestion
 */
router.post(
  '/reminders/:reminderId/accept',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reminderId } = req.params;
      const { linkedTaskId } = req.body;

      const result = await reminderEngine.acceptReminder(reminderId, linkedTaskId);

      res.json({
        success: result.success,
        message: result.success ? 'Reminder accepted' : 'Failed to accept reminder',
        taskId: result.taskId,
      });
    } catch (err) {
      logError('[API] Error accepting reminder', err);
      next(err);
    }
  }
);

/**
 * POST /api/intelligence/reminders/:reminderId/dismiss
 * Dismiss a reminder suggestion
 */
router.post(
  '/reminders/:reminderId/dismiss',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reminderId } = req.params;
      const { reason } = req.body;

      const result = await reminderEngine.dismissReminder(reminderId, reason || 'User dismissed');

      res.json({
        success: result.success,
        message: result.success ? 'Reminder dismissed' : 'Failed to dismiss reminder',
      });
    } catch (err) {
      logError('[API] Error dismissing reminder', err);
      next(err);
    }
  }
);

// ============================================================================
// MEETING AGENDAS ENDPOINTS
// ============================================================================

/**
 * POST /api/intelligence/agendas/generate/:meetingId
 * Generate agenda for meeting
 */
router.post(
  '/agendas/generate/:meetingId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { meetingId } = req.params;

      logInfo('[API] Generating agenda', { meetingId });

      const agenda = await agendaGeneration.generateMeetingAgenda(meetingId);

      if (!agenda) {
        return res.status(400).json({
          error: 'Could not generate agenda for this meeting',
        });
      }

      res.json({
        success: true,
        data: agenda,
      });
    } catch (err) {
      logError('[API] Error generating agenda', err);
      next(err);
    }
  }
);

/**
 * GET /api/intelligence/agendas/:meetingId
 * Get agenda for meeting
 */
router.get('/agendas/:meetingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meetingId } = req.params;

    const agenda = await agendaGeneration.getAgenda(meetingId);

    if (!agenda) {
      return res.status(404).json({ error: 'Agenda not found' });
    }

    res.json({
      success: true,
      data: agenda,
    });
  } catch (err) {
    logError('[API] Error fetching agenda', err);
    next(err);
  }
});

/**
 * PUT /api/intelligence/agendas/:meetingId
 * Update agenda
 */
router.put('/agendas/:meetingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meetingId } = req.params;
    const { objectives, talkingPoints, decisionsNeeded, prepItems } = req.body;

    logInfo('[API] Updating agenda', { meetingId });

    const agenda = await agendaGeneration.updateAgenda(meetingId, {
      objectives,
      talkingPoints,
      decisionsNeeded,
      prepItems,
    });

    if (!agenda) {
      return res.status(400).json({ error: 'Could not update agenda' });
    }

    res.json({
      success: true,
      data: agenda,
    });
  } catch (err) {
    logError('[API] Error updating agenda', err);
    next(err);
  }
});

/**
 * POST /api/intelligence/agendas/:meetingId/regenerate
 * Regenerate agenda (fresh AI generation)
 */
router.post(
  '/agendas/:meetingId/regenerate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { meetingId } = req.params;

      logInfo('[API] Regenerating agenda', { meetingId });

      const agenda = await agendaGeneration.regenerateAgenda(meetingId);

      res.json({
        success: true,
        message: 'Agenda regenerated',
        data: agenda,
      });
    } catch (err) {
      logError('[API] Error regenerating agenda', err);
      next(err);
    }
  }
);

/**
 * POST /api/intelligence/agendas/:meetingId/objectives
 * Add objective to agenda
 */
router.post(
  '/agendas/:meetingId/objectives',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { meetingId } = req.params;
      const { objective } = req.body;

      if (!objective) {
        return res.status(400).json({ error: 'Missing objective' });
      }

      const agenda = await agendaGeneration.addObjective(meetingId, objective);

      res.json({
        success: true,
        data: agenda,
      });
    } catch (err) {
      logError('[API] Error adding objective', err);
      next(err);
    }
  }
);

// ============================================================================
// WEEKLY BRIEFS ENDPOINTS
// ============================================================================

/**
 * POST /api/intelligence/briefs/generate?talentId=:talentId
 * Generate weekly brief for talent
 */
router.post('/briefs/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId, weekStart } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    const week = weekStart ? new Date(weekStart as string) : new Date();
    week.setDate(week.getDate() - week.getDay()); // Start of week

    logInfo('[API] Generating weekly brief', { talentId });

    const brief = await briefGenerator.generateWeeklyBrief(talentId, week);

    res.json({
      success: true,
      data: brief,
    });
  } catch (err) {
    logError('[API] Error generating brief', err);
    next(err);
  }
});

/**
 * GET /api/intelligence/briefs?talentId=:talentId&weekStart=:weekStart
 * Get weekly brief for talent
 */
router.get('/briefs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId, weekStart } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    const week = weekStart ? new Date(weekStart as string) : new Date();

    const brief = await briefGenerator.getWeeklyBrief(talentId, week);

    res.json({
      success: true,
      data: brief,
    });
  } catch (err) {
    logError('[API] Error fetching brief', err);
    next(err);
  }
});

/**
 * GET /api/intelligence/briefs/recent?talentId=:talentId
 * Get recent briefs for talent
 */
router.get('/briefs/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId, limit } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    const briefs = await briefGenerator.getRecentBriefs(
      talentId,
      limit ? parseInt(limit as string) : 4
    );

    res.json({
      success: true,
      data: briefs,
      count: briefs.length,
    });
  } catch (err) {
    logError('[API] Error fetching recent briefs', err);
    next(err);
  }
});

/**
 * POST /api/intelligence/briefs/:briefId/read
 * Mark brief as read
 */
router.post(
  '/briefs/:briefId/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { briefId } = req.params;

      const brief = await briefGenerator.markBriefAsRead(briefId);

      res.json({
        success: true,
        data: brief,
      });
    } catch (err) {
      logError('[API] Error marking brief as read', err);
      next(err);
    }
  }
);

// ============================================================================
// CALENDAR OVERLOAD DETECTION ENDPOINTS
// ============================================================================

/**
 * POST /api/intelligence/overload/analyze?talentId=:talentId
 * Analyze calendar for overload
 */
router.post('/overload/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId, dateStart, dateEnd } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    const start = dateStart ? new Date(dateStart as string) : new Date();
    const end = dateEnd ? new Date(dateEnd as string) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    logInfo('[API] Analyzing calendar for overload', { talentId, start, end });

    const analysis = await overloadDetection.analyzeCalendarForOverload(talentId, start, end);
    const warningIds = await overloadDetection.createOverloadWarnings(talentId, analysis);

    res.json({
      success: true,
      analysis,
      warningsCreated: warningIds.length,
      warningIds,
    });
  } catch (err) {
    logError('[API] Error analyzing overload', err);
    next(err);
  }
});

/**
 * GET /api/intelligence/overload/warnings?talentId=:talentId
 * Get active warnings for talent
 */
router.get('/overload/warnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId } = req.query;

    if (!talentId || typeof talentId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: talentId',
      });
    }

    const warnings = await overloadDetection.getActiveWarnings(talentId);

    res.json({
      success: true,
      data: warnings,
      count: warnings.length,
    });
  } catch (err) {
    logError('[API] Error fetching warnings', err);
    next(err);
  }
});

/**
 * POST /api/intelligence/overload/warnings/:warningId/acknowledge
 * Acknowledge warning
 */
router.post(
  '/overload/warnings/:warningId/acknowledge',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { warningId } = req.params;

      const warning = await overloadDetection.acknowledgeWarning(warningId);

      res.json({
        success: true,
        data: warning,
      });
    } catch (err) {
      logError('[API] Error acknowledging warning', err);
      next(err);
    }
  }
);

/**
 * POST /api/intelligence/overload/warnings/:warningId/dismiss
 * Dismiss warning
 */
router.post(
  '/overload/warnings/:warningId/dismiss',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { warningId } = req.params;

      const warning = await overloadDetection.dismissWarning(warningId);

      res.json({
        success: true,
        data: warning,
      });
    } catch (err) {
      logError('[API] Error dismissing warning', err);
      next(err);
    }
  }
);

// ============================================================================
// TALENT AVAILABILITY ENDPOINTS
// ============================================================================

/**
 * GET /api/intelligence/availability/:talentId
 * Get talent availability settings
 */
router.get('/availability/:talentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId } = req.params;

    const availability = await talentAvailability.getTalentAvailability(talentId);

    res.json({
      success: true,
      data: availability,
    });
  } catch (err) {
    logError('[API] Error fetching availability', err);
    next(err);
  }
});

/**
 * PUT /api/intelligence/availability/:talentId
 * Set talent availability
 */
router.put('/availability/:talentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { talentId } = req.params;
    const {
      workingDays,
      startHour,
      endHour,
      timezone,
      bufferBetweenMeetings,
      maxMeetingsPerDay,
      minPrepTimeMinutes,
    } = req.body;

    logInfo('[API] Setting availability', { talentId });

    const availability = await talentAvailability.setTalentAvailability(talentId, {
      workingDays,
      startHour,
      endHour,
      timezone,
      bufferBetweenMeetings,
      maxMeetingsPerDay,
      minPrepTimeMinutes,
    });

    res.json({
      success: true,
      data: availability,
    });
  } catch (err) {
    logError('[API] Error setting availability', err);
    next(err);
  }
});

/**
 * POST /api/intelligence/availability/:talentId/blackout
 * Add blackout date
 */
router.post(
  '/availability/:talentId/blackout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { talentId } = req.params;
      const { startDate, endDate, reason, notes, visibleOnCalendar } = req.body;

      if (!startDate || !endDate || !reason) {
        return res.status(400).json({
          error: 'Missing required fields: startDate, endDate, reason',
        });
      }

      logInfo('[API] Adding blackout date', { talentId, reason });

      const blackout = await talentAvailability.addBlackoutDate(
        talentId,
        new Date(startDate),
        new Date(endDate),
        reason,
        notes,
        visibleOnCalendar !== false
      );

      res.json({
        success: true,
        data: blackout,
      });
    } catch (err) {
      logError('[API] Error adding blackout', err);
      next(err);
    }
  }
);

/**
 * GET /api/intelligence/availability/:talentId/blackout
 * Get blackout dates
 */
router.get(
  '/availability/:talentId/blackout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { talentId } = req.params;
      const { startDate, endDate } = req.query;

      const blackouts = await talentAvailability.getBlackoutDates(
        talentId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: blackouts,
        count: blackouts.length,
      });
    } catch (err) {
      logError('[API] Error fetching blackout dates', err);
      next(err);
    }
  }
);

/**
 * DELETE /api/intelligence/availability/blackout/:blackoutId
 * Remove blackout date
 */
router.delete(
  '/availability/blackout/:blackoutId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { blackoutId } = req.params;

      logInfo('[API] Removing blackout date', { blackoutId });

      const result = await talentAvailability.removeBlackoutDate(blackoutId);

      res.json({
        success: result.success,
        message: result.success ? 'Blackout removed' : 'Failed to remove blackout',
      });
    } catch (err) {
      logError('[API] Error removing blackout', err);
      next(err);
    }
  }
);

/**
 * POST /api/intelligence/availability/:talentId/check-time
 * Check if talent is available at specific time
 */
router.post(
  '/availability/:talentId/check-time',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { talentId } = req.params;
      const { dateTime } = req.body;

      if (!dateTime) {
        return res.status(400).json({ error: 'Missing required field: dateTime' });
      }

      const isAvailable = await talentAvailability.isAvailableAtTime(
        talentId,
        new Date(dateTime)
      );

      res.json({
        success: true,
        available: isAvailable,
      });
    } catch (err) {
      logError('[API] Error checking availability', err);
      next(err);
    }
  }
);

/**
 * POST /api/intelligence/availability/:talentId/find-slot
 * Find next available meeting slot
 */
router.post(
  '/availability/:talentId/find-slot',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { talentId } = req.params;
      const { durationMinutes = 60, startAfter, maxDaysToSearch = 30 } = req.body;

      const slot = await talentAvailability.findNextAvailableSlot(
        talentId,
        durationMinutes,
        startAfter ? new Date(startAfter) : new Date(),
        maxDaysToSearch
      );

      if (!slot) {
        return res.json({
          success: true,
          available: false,
          message: `No available slot found within ${maxDaysToSearch} days`,
        });
      }

      res.json({
        success: true,
        available: true,
        data: slot,
      });
    } catch (err) {
      logError('[API] Error finding slot', err);
      next(err);
    }
  }
);

/**
 * POST /api/intelligence/availability/:talentId/validate-meeting
 * Validate meeting time against availability
 */
router.post(
  '/availability/:talentId/validate-meeting',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { talentId } = req.params;
      const { startTime, endTime } = req.body;

      if (!startTime || !endTime) {
        return res.status(400).json({
          error: 'Missing required fields: startTime, endTime',
        });
      }

      const validation = await talentAvailability.checkMeetingTimeValidity(
        talentId,
        new Date(startTime),
        new Date(endTime)
      );

      res.json({
        success: true,
        data: validation,
      });
    } catch (err) {
      logError('[API] Error validating meeting', err);
      next(err);
    }
  }
);

export default router;

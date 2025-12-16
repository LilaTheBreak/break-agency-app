import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { getCreatorInbox } from '../services/inbox/creatorInboxService.js';
import { getCreatorAnalyticsSummary } from '../services/creators/creatorAnalyticsService.js';
import { generateCaptionIdeas, generateFollowUpSuggestions } from '../services/ai/agents/creatorAgent.js';

const router = Router();
const MOCK_USER_ID = 'clxrz45gn000008l4hy285p0g'; // Mock user for demonstration

/**
 * GET /api/creator/tasks
 * Fetches the list of AI-generated tasks for the creator.
 */
router.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await prisma.creatorTask.findMany({
      where: { userId: MOCK_USER_ID, status: 'pending' },
      orderBy: { dueDate: 'asc' },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/creator/inbox
 * Fetches the prioritized inbox for the creator.
 */
router.get('/inbox', async (req, res, next) => {
  try {
    const inbox = await getCreatorInbox(MOCK_USER_ID);
    res.json(inbox);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/creator/analytics
 * Fetches the analytics summary for the creator.
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const analytics = await getCreatorAnalyticsSummary(MOCK_USER_ID);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/creator/ai/draft-caption
 * Generates caption ideas for a post.
 */
router.post('/ai/draft-caption', async (req, res, next) => {
  try {
    const result = await generateCaptionIdeas(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Add other routes like /ai/follow-up here...

export default router;
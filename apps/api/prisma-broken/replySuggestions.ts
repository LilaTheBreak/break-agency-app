import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { routeEmail } from '../services/email/emailRoutingEngine.js';

const router = Router();

/**
 * GET /api/inbox/reply-suggestions/:threadId
 * Fetches pending reply suggestions for a deal thread.
 */
router.get('/:threadId', async (req, res, next) => {
  const { threadId } = req.params;
  try {
    const suggestions = await prisma.negotiationReplySuggestion.findMany({
      where: { threadId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inbox/reply-suggestions/:id/approve
 * Approves a suggestion and sends the email.
 */
router.post('/:id/approve', async (req, res, next) => {
  const { id } = req.params;
  try {
    const suggestion = await prisma.negotiationReplySuggestion.update({
      where: { id },
      data: { status: 'approved' },
      include: { thread: true },
    });

    // Use the S50 email router to send the approved email
    await routeEmail('AI_BRAND_REPLY', { to: suggestion.thread.brandEmail, subject: suggestion.aiSubject, body: suggestion.aiBody });

    res.json({ message: 'Suggestion approved and email queued for sending.' });
  } catch (error) {
    next(error);
  }
});

export default router;
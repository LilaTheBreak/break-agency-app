import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { autoReplyQueue } from '../worker/queues/autoReplyQueue.js';

const router = Router();

/**
 * POST /api/inbox/:emailId/auto-reply
 * Triggers the auto-reply generation pipeline.
 */
router.post('/:emailId/auto-reply', async (req, res) => {
  const { emailId } = req.params;
  await autoReplyQueue.add('generate-reply', { emailId });
  res.status(202).json({ message: 'AI auto-reply generation has been queued.' });
});

/**
 * GET /api/inbox/:emailId/reply
 * Fetches the generated auto-reply for an email.
 */
router.get('/:emailId/reply', async (req, res, next) => {
  try {
    const reply = await prisma.inboxAutoReply.findUnique({ where: { emailId: req.params.emailId } });
    res.json(reply);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inbox/:emailId/auto-reply/send
 * Manually approves and sends a drafted reply.
 */
router.post('/:emailId/auto-reply/send', async (req, res) => {
  // In a real app, this would call the gmailService to send the email.
  console.log(`[API] Manually sending reply for email ${req.params.emailId}`);
  await prisma.inboxAutoReply.update({ where: { emailId: req.params.emailId }, data: { status: 'sent' } });
  res.json({ message: 'Reply sent successfully.' });
});

export default router;
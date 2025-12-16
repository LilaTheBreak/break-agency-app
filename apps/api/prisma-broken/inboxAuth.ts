import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
  session: any;
}

/**
 * Middleware to verify if the logged-in user has permission to access a specific inbox.
 */
export async function canAccessInbox(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const inboxId = req.params.inboxId || req.body.inboxId || req.session.activeInboxId;

  if (!userId || !inboxId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const socialAccount = await prisma.socialAccount.findUnique({
    where: { id: inboxId },
    include: { talent: { include: { user: true } } },
  });

  if (!socialAccount) {
    return res.status(404).json({ error: 'Inbox not found.' });
  }

  // The user owns the social account directly (it's their manager inbox)
  if (socialAccount.userId === userId) {
    return next();
  }

  // The user is a manager for the talent associated with the inbox
  if (socialAccount.talent?.user?.managedTalentIds?.includes(userId)) {
    return next();
  }

  return res.status(403).json({ error: 'You do not have permission to access this inbox.' });
}
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import type { SessionUser } from '../lib/session.js';
import { buildSessionUser } from '../lib/session.js';
// Assume you have a way to verify a session token, e.g., using Clerk, JWT, etc.
// import { clerkClient } from '@clerk/clerk-sdk-node';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
    }
  }
}

/**
 * Global authentication middleware.
 * Verifies the user's session and injects a `req.user` object with essential RBAC fields.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  // This is a placeholder for your actual session/token validation logic.
  // const { sessionId } = req.cookies;
  // if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });
  const userId = 'clerk_user_id_placeholder'; // Replace with ID from verified session

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  req.user = buildSessionUser(user);
  next();
};
/**
 * Rate Limiting Middleware
 * 
 * Protects auth endpoints and sensitive operations from brute force attacks
 * and abuse. Uses in-memory store for simplicity (can be replaced with Redis).
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Rate limiting options
 */
interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  message?: string; // Custom error message
  statusCode?: number; // HTTP status code for rate limit exceeded
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Auth endpoints: 5 attempts per 15 minutes
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  
  // OAuth callbacks: 10 attempts per 5 minutes
  AUTH_OAUTH: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again in 5 minutes.',
  },

  // Password reset: 3 attempts per hour
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many password reset requests. Please try again in 1 hour.',
  },

  // User registration: 3 attempts per hour per IP
  USER_REGISTRATION: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many registration attempts. Please try again in 1 hour.',
  },

  // API general: 100 requests per minute per user
  API_GENERAL: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },

  // File uploads: 10 per 5 minutes
  FILE_UPLOAD: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many file uploads. Please try again in 5 minutes.',
  },

  // Email sending: 20 per hour
  EMAIL_SEND: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: 'Too many emails sent. Please try again in 1 hour.',
  },

  // Admin actions: 50 per minute
  ADMIN_ACTIONS: {
    windowMs: 60 * 1000,
    maxRequests: 50,
    message: 'Too many admin actions. Please slow down.',
  },

  // Messaging: 30 per minute per user
  MESSAGING: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Too many messages. Please slow down.',
  },

  // AI endpoints: 20 per minute per user
  AI_REQUESTS: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Too many AI requests. Please wait a moment.',
  },

  // Deal mutations: 30 per minute per user
  DEAL_MUTATIONS: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Too many deal operations. Please slow down.',
  },
};

/**
 * Create rate limiting middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    message = 'Too many requests. Please try again later.',
    statusCode = 429,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    // Reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count (if not skipping successful requests)
    if (!skipSuccessfulRequests) {
      entry.count++;
    }

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      res.status(statusCode).json({
        error: message || "You're making requests too quickly. Please slow down and try again.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter,
        retryAfterSeconds: retryAfter
      });
      
      console.warn(`[RATE LIMIT] Exceeded for key: ${key} (${entry.count}/${maxRequests})`);
      return;
    }

    // If skipping successful requests, increment after response
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          entry!.count++;
        }
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    next();
  };
}

/**
 * Default key generator: IP + User ID (if authenticated)
 */
function defaultKeyGenerator(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * IP-only key generator (for pre-auth endpoints)
 */
export function ipKeyGenerator(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * User ID key generator (for authenticated endpoints)
 */
export function userKeyGenerator(req: Request): string {
  return (req as any).user?.id || 'anonymous';
}

/**
 * Cleanup expired entries periodically
 */
export function startRateLimitCleanup(intervalMs: number = 60000) {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RATE LIMIT] Cleaned up ${cleaned} expired entries`);
    }
  }, intervalMs);

  console.log('[RATE LIMIT] Cleanup task started');
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalKeys: number;
  topLimitedKeys: Array<{ key: string; count: number; resetTime: Date }>;
} {
  const entries = Array.from(rateLimitStore.entries())
    .map(([key, entry]) => ({
      key,
      count: entry.count,
      resetTime: new Date(entry.resetTime),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalKeys: rateLimitStore.size,
    topLimitedKeys: entries,
  };
}

/**
 * Manually reset rate limit for a key
 */
export function resetRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Auth endpoints
  authLogin: createRateLimiter({
    ...RATE_LIMITS.AUTH_LOGIN,
    keyGenerator: ipKeyGenerator,
  }),

  authOAuth: createRateLimiter({
    ...RATE_LIMITS.AUTH_OAUTH,
    keyGenerator: ipKeyGenerator,
  }),

  passwordReset: createRateLimiter({
    ...RATE_LIMITS.PASSWORD_RESET,
    keyGenerator: ipKeyGenerator,
  }),

  userRegistration: createRateLimiter({
    ...RATE_LIMITS.USER_REGISTRATION,
    keyGenerator: ipKeyGenerator,
  }),

  // API endpoints
  apiGeneral: createRateLimiter({
    ...RATE_LIMITS.API_GENERAL,
    keyGenerator: userKeyGenerator,
  }),

  fileUpload: createRateLimiter({
    ...RATE_LIMITS.FILE_UPLOAD,
    keyGenerator: userKeyGenerator,
  }),

  emailSend: createRateLimiter({
    ...RATE_LIMITS.EMAIL_SEND,
    keyGenerator: userKeyGenerator,
  }),

  adminActions: createRateLimiter({
    ...RATE_LIMITS.ADMIN_ACTIONS,
    keyGenerator: userKeyGenerator,
  }),

  messaging: createRateLimiter({
    ...RATE_LIMITS.MESSAGING,
    keyGenerator: userKeyGenerator,
  }),

  aiRequests: createRateLimiter({
    ...RATE_LIMITS.AI_REQUESTS,
    keyGenerator: userKeyGenerator,
  }),

  dealMutations: createRateLimiter({
    ...RATE_LIMITS.DEAL_MUTATIONS,
    keyGenerator: userKeyGenerator,
  }),
};

/**
 * Global rate limiter for all API endpoints
 * Very permissive, just to prevent extreme abuse
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // 200 requests per minute
  message: 'Too many requests from this IP. Please try again later.',
  keyGenerator: ipKeyGenerator,
});

export default {
  createRateLimiter,
  rateLimiters,
  globalRateLimiter,
  startRateLimitCleanup,
  getRateLimitStats,
  resetRateLimit,
  ipKeyGenerator,
  userKeyGenerator,
  RATE_LIMITS,
};

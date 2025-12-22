import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/signup
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Moderate rate limiter for API endpoints
 * Prevents abuse while allowing legitimate usage
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for email/sensitive operations
 * Extra protection for operations that trigger external actions
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: 'Too many requests for this operation, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

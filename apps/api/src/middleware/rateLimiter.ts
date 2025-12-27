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

/**
 * Rate limiter for file uploads
 * Prevents excessive upload attempts
 */
export const fileUploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 uploads per 5 minutes
  message: 'Too many file uploads. Please try again in 5 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset requests
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset requests. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for OAuth callbacks
 * Prevents callback abuse
 */
export const oauthCallbackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 OAuth attempts per 5 minutes
  message: 'Too many authentication attempts. Please try again in 5 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for admin actions
 * Moderate protection for admin endpoints
 */
export const adminActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 admin actions per minute
  message: 'Too many admin actions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

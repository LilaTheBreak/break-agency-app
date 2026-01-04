/**
 * Standardized Error Handler
 * 
 * Ensures all API errors follow ONE consistent shape:
 * {
 *   success: false,
 *   error: string,
 *   message: string,
 *   code?: string
 * }
 * 
 * Also ensures all errors are:
 * - Logged with context (route + userId)
 * - Sent to Sentry when available
 * - Never swallowed silently
 */

import { Response, Request } from "express";
import { logError } from "../lib/logger.js";
import * as Sentry from "@sentry/node";

export interface StandardErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
}

/**
 * Send standardized error response
 * 
 * @param res - Express response object
 * @param error - Error object or message string
 * @param req - Express request object (for context)
 * @param code - Error code (optional)
 * @param status - HTTP status code (default: 500)
 */
export function sendStandardError(
  res: Response,
  error: unknown,
  req?: Request,
  code?: string,
  status: number = 500
): void {
  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Determine error code if not provided
  let errorCode = code || "INTERNAL_ERROR";
  if (!code && error instanceof Error) {
    if (error.message.includes("not found") || error.message.includes("Not found")) {
      errorCode = "NOT_FOUND";
      status = 404;
    } else if (error.message.includes("permission") || error.message.includes("forbidden")) {
      errorCode = "FORBIDDEN";
      status = 403;
    } else if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
      errorCode = "UNAUTHORIZED";
      status = 401;
    } else if (error.message.includes("validation") || error.message.includes("invalid")) {
      errorCode = "VALIDATION_ERROR";
      status = 400;
    }
  }
  
  // Build context for logging
  const context: Record<string, unknown> = {
    route: req?.path || req?.url || "unknown",
    method: req?.method || "unknown",
    userId: (req as any)?.user?.id || "anonymous",
  };
  
  // Log error with context
  logError(errorMessage, error, context);
  
  // Send to Sentry if available
  if (typeof Sentry !== "undefined" && Sentry.captureException) {
    Sentry.captureException(error instanceof Error ? error : new Error(errorMessage), {
      tags: {
        errorCode,
        route: context.route as string,
        userId: context.userId as string,
      },
      extra: context,
    });
  }
  
  // Send standardized error response
  const response: StandardErrorResponse = {
    success: false,
    error: errorMessage,
    message: errorMessage,
    code: errorCode,
  };
  
  res.status(status).json(response);
}

/**
 * Wrapper for async route handlers that automatically catches errors
 * 
 * Usage:
 * router.get("/endpoint", standardErrorHandler(async (req, res) => {
 *   // Your route logic here
 *   // Errors are automatically caught and sent in standard format
 * }));
 */
export function standardErrorHandler(
  handler: (req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendStandardError(res, error, req);
    }
  };
}


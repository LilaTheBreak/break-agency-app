/**
 * Standardized API Response Helpers
 * 
 * Ensures all API responses follow a consistent contract:
 * - Success: { success: true, data: T }
 * - Error: { success: false, error: { code, message, details? } }
 */

import { Response } from "express";

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Send a successful API response
 */
export function sendSuccess<T>(res: Response, data: T, status: number = 200): void {
  res.status(status).json({
    success: true,
    data,
  });
}

/**
 * Send an error API response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  status: number = 500,
  details?: any
): void {
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}

/**
 * Send a list response (array)
 */
export function sendList<T>(res: Response, items: T[], status: number = 200): void {
  sendSuccess(res, items, status);
}

/**
 * Send an empty list response
 */
export function sendEmptyList(res: Response, status: number = 200): void {
  sendList(res, [], status);
}

/**
 * Handle errors consistently
 */
export function handleApiError(
  res: Response,
  error: unknown,
  context: string,
  defaultCode: string = "INTERNAL_ERROR",
  defaultMessage: string = "An unexpected error occurred"
): void {
  if (error instanceof Error) {
    // Determine status code based on error type
    let status = 500;
    let code = defaultCode;
    let message = error.message || defaultMessage;

    // Handle known error types
    if (error.message.includes("not found") || error.message.includes("Not found")) {
      status = 404;
      code = "NOT_FOUND";
    } else if (error.message.includes("permission") || error.message.includes("forbidden")) {
      status = 403;
      code = "FORBIDDEN";
    } else if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
      status = 401;
      code = "UNAUTHORIZED";
    } else if (error.message.includes("validation") || error.message.includes("invalid")) {
      status = 400;
      code = "VALIDATION_ERROR";
    }

    sendError(res, code, message, status, { context });
  } else {
    sendError(res, defaultCode, defaultMessage, 500, { context });
  }
}

/**
 * Feature disabled response
 */
export function sendFeatureDisabled(res: Response, featureName: string): void {
  sendError(
    res,
    "FEATURE_DISABLED",
    `This feature (${featureName}) is currently disabled. Contact an administrator to enable it.`,
    503
  );
}


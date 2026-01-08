/**
 * Error Normalization Utility
 * Purpose: Translate technical errors into user-friendly messages
 * Design: Sanitize sensitive data, provide actionable feedback
 */

/**
 * Common Prisma error codes and their user-friendly messages
 */
const PRISMA_ERROR_MESSAGES = {
  P2000: "The data provided is too long for the database field.",
  P2001: "The record you're looking for doesn't exist.",
  P2002: "A record with this unique value already exists.",
  P2003: "This action would break a relationship with another record.",
  P2025: "The record you're trying to update or delete doesn't exist.",
  P1001: "Can't connect to the database. Please try again.",
  P1002: "Database connection timed out. Please try again.",
  P1008: "Request timed out. Please try again.",
  P1017: "Database connection was closed unexpectedly.",
};

/**
 * Common HTTP error messages
 */
const HTTP_ERROR_MESSAGES = {
  400: "Invalid request. Please check your input and try again.",
  401: "You need to be logged in to do this.",
  403: "You don't have permission to perform this action.",
  404: "The item you're looking for doesn't exist.",
  409: "This action conflicts with existing data.",
  429: "Too many requests. Please slow down and try again.",
  500: "Something went wrong on our end. Please try again.",
  502: "Service temporarily unavailable. Please try again.",
  503: "Service temporarily unavailable. Please try again.",
  504: "Request timed out. Please try again.",
};

/**
 * Normalize error for user display
 * @param {Error|Object} error - The error to normalize
 * @returns {Object} { message, userMessage, originalError }
 */
export function normalizeError(error) {
  // Handle null/undefined
  if (!error) {
    return {
      message: "An unknown error occurred",
      userMessage: "Something went wrong. Please try again.",
      originalError: null,
    };
  }

  // Extract error details
  const errorMessage = error.message || error.error || String(error);
  const errorCode = error.code || error.status || null;

  let userMessage = "Something went wrong. Please try again.";
  let internalMessage = errorMessage;

  // Handle Prisma errors
  if (errorCode && PRISMA_ERROR_MESSAGES[errorCode]) {
    userMessage = PRISMA_ERROR_MESSAGES[errorCode];
    internalMessage = `Prisma ${errorCode}: ${errorMessage}`;
  }
  // Handle HTTP errors
  else if (errorCode && HTTP_ERROR_MESSAGES[errorCode]) {
    userMessage = HTTP_ERROR_MESSAGES[errorCode];
  }
  // Handle specific error patterns
  else if (errorMessage.includes("ECONNREFUSED")) {
    userMessage = "Unable to connect to the server. Please check your internet connection.";
    internalMessage = "Connection refused: " + errorMessage;
  } else if (errorMessage.includes("ETIMEDOUT") || errorMessage.includes("timeout")) {
    userMessage = "Request timed out. Please try again.";
    internalMessage = "Timeout: " + errorMessage;
  } else if (errorMessage.includes("ENOTFOUND")) {
    userMessage = "Unable to reach the server. Please check your internet connection.";
    internalMessage = "DNS lookup failed: " + errorMessage;
  } else if (errorMessage.includes("Network Error") || errorMessage.includes("network")) {
    userMessage = "Network error. Please check your internet connection.";
    internalMessage = "Network error: " + errorMessage;
  } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("unauthorized")) {
    userMessage = "Your session has expired. Please log in again.";
  } else if (errorMessage.includes("Forbidden") || errorMessage.includes("forbidden")) {
    userMessage = "You don't have permission to perform this action.";
  } else if (errorMessage.includes("Not Found") || errorMessage.includes("not found")) {
    userMessage = "The item you're looking for doesn't exist.";
  } else if (errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
    userMessage = "A record with this value already exists.";
    internalMessage = "Unique constraint violation: " + errorMessage;
  }

  return {
    message: internalMessage, // For logging
    userMessage, // For display to users
    originalError: error,
  };
}

/**
 * Sanitize error for logging (remove sensitive data)
 * @param {Error|Object} error - The error to sanitize
 * @returns {Object} Sanitized error object
 */
export function sanitizeErrorForLogging(error) {
  if (!error) return { message: "Unknown error" };

  const sanitized = {
    message: error.message || String(error),
    code: error.code || null,
    status: error.status || null,
    timestamp: new Date().toISOString(),
  };

  // Remove sensitive fields
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "authorization",
    "cookie",
    "sessionId",
    "session_id",
  ];

  if ((error as any).stack) {
    // Include stack but sanitize any URLs with tokens
    sanitized.stack = (error as any).stack.replace(/[?&](token|key|secret|password)=[^&\s]*/gi, "$1=***");
  }

  // Sanitize any object properties
  if (typeof error === "object") {
    Object.keys(error as any).forEach((key) => {
      if (!sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        if (typeof (error as any)[key] === "string" || typeof (error as any)[key] === "number") {
          sanitized[key] = (error as any)[key];
        }
      }
    });
  }

  return sanitized;
}

/**
 * Check if error should trigger an alert
 * @param {Error|Object} error - The error to check
 * @returns {boolean} Whether to send alert
 */
export function shouldAlert(error: any) {
  if (!error) return false;

  const errorMessage = String(error.message || error.error || error).toLowerCase();
  const errorCode = error.code || error.status;

  // Alert on critical errors
  const criticalPatterns = [
    "database", // Database connection issues
    "prisma", // Prisma errors
    "econnrefused", // Connection refused
    "cannot connect", // Connection failures
    "out of memory", // Memory issues
    "segmentation fault", // Crashes
  ];

  // Alert on critical HTTP status codes
  const criticalStatusCodes = [500, 502, 503, 504];

  return (
    criticalPatterns.some((pattern) => errorMessage.includes(pattern)) ||
    criticalStatusCodes.includes(errorCode)
  );
}

/**
 * Format error for Slack/Email alert
 * @param {Error|Object} error - The error to format
 * @param {Object} context - Additional context (user, endpoint, etc.)
 * @returns {string} Formatted alert message
 */
export function formatAlertMessage(error: any, context: any = {}) {
  const { message, userMessage } = normalizeError(error);
  const timestamp = new Date().toISOString();

  let alert = `🚨 **Critical Error Alert**\n\n`;
  alert += `**Time:** ${timestamp}\n`;
  alert += `**Error:** ${message}\n`;

  if (context?.endpoint) {
    alert += `**Endpoint:** ${context.endpoint}\n`;
  }

  if (context?.userId) {
    alert += `**User ID:** ${context.userId}\n`;
  }

  if (context?.environment) {
    alert += `**Environment:** ${context.environment}\n`;
  }

  alert += `\n**User-Facing Message:** ${userMessage}\n`;

  if ((error as any)?.stack) {
    alert += `\n**Stack Trace (first 500 chars):**\n\`\`\`\n${(error as any).stack.substring(0, 500)}...\n\`\`\`\n`;
  }

  return alert;
}

export default {
  normalizeError,
  sanitizeErrorForLogging,
  shouldAlert,
  formatAlertMessage,
};

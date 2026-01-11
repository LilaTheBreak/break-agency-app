/**
 * Error Handler Utilities
 * Provides consistent error message extraction across the app
 */

/**
 * Extract a readable error message from various error types
 * @param {Error|string|object} err - The error object
 * @param {string} defaultMessage - Fallback message if no error message found
 * @returns {string} The extracted error message
 */
export function getErrorMessage(err, defaultMessage = "An error occurred") {
  if (!err) {
    return defaultMessage;
  }

  // Standard Error object
  if (err instanceof Error) {
    return err.message;
  }

  // String error
  if (typeof err === "string") {
    return err;
  }

  // Object with message property
  if (typeof err === "object") {
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
    if ("error" in err && typeof err.error === "string") {
      return err.error;
    }
    if ("msg" in err && typeof err.msg === "string") {
      return err.msg;
    }
  }

  // Fallback
  return defaultMessage;
}

/**
 * Log error with proper formatting
 * @param {string} context - Where the error occurred
 * @param {Error|string|object} err - The error
 */
export function logError(context, err) {
  const message = getErrorMessage(err);
  console.error(`${context}:`, message, err);
}

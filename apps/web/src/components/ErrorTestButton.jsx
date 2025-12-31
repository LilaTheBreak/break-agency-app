/**
 * ErrorTestButton Component
 * 
 * A test component to verify Sentry error tracking is working correctly.
 * This should only be used in development or for testing purposes.
 * 
 * Usage:
 * <ErrorTestButton />
 */

import React from "react";
import * as Sentry from "@sentry/react";
import { logInfo, countMetric } from "../lib/sentry.js";

export function ErrorTestButton() {
  const handleTestError = () => {
    // Send a log before throwing the error
    logInfo("User triggered test error", {
      action: "test_error_button_click",
      timestamp: new Date().toISOString(),
    });

    // Send a test metric before throwing the error
    countMetric("test_error_button_clicked", 1, {
      component: "ErrorTestButton",
    });

    // Throw a test error
    throw new Error("This is your first error! (Sentry Test)");
  };

  // Only show in development or if explicitly enabled
  if (import.meta.env.MODE !== "development" && !import.meta.env.VITE_ENABLE_ERROR_TEST) {
    return null;
  }

  return (
    <button
      onClick={handleTestError}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-700 transition-colors"
      style={{ display: import.meta.env.MODE === "development" ? "block" : "none" }}
    >
      🧪 Test Sentry Error
    </button>
  );
}

export default ErrorTestButton;


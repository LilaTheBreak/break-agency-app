/**
 * Alerting System
 * Purpose: Send alerts for critical failures
 * Design: Minimal, reliable, with throttling to prevent spam
 */

import { sanitizeErrorForLogging, shouldAlert, formatAlertMessage } from "./errorNormalizer.js";

// Alert throttling: Don't send same error type more than once per hour
const alertThrottle = new Map<string, number>();
const THROTTLE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Send alert for critical error
 * @param error - The error to alert on
 * @param context - Additional context (endpoint, userId, etc.)
 */
export async function sendAlert(error: any, context: any = {}) {
  // Check if this error should trigger an alert
  if (!shouldAlert(error)) {
    return;
  }

  // Throttle duplicate alerts
  const errorKey = `${error.code || "unknown"}-${error.message?.substring(0, 50) || "unknown"}`;
  const lastAlertTime = alertThrottle.get(errorKey);
  const now = Date.now();

  if (lastAlertTime && now - lastAlertTime < THROTTLE_WINDOW) {
    console.log(`[ALERT] Throttled duplicate alert for: ${errorKey}`);
    return;
  }

  // Update throttle map
  alertThrottle.set(errorKey, now);

  // Format alert message
  const alertMessage = formatAlertMessage(error, {
    ...context,
    environment: process.env.NODE_ENV || "development",
  });

  // Send to configured alert channels
  await Promise.allSettled([
    sendEmailAlert(alertMessage, context),
    sendSlackAlert(alertMessage, context),
  ]);
}

/**
 * Send email alert (if configured)
 */
async function sendEmailAlert(message: string, context: any) {
  const alertEmails = process.env.ALERT_EMAILS;

  if (!alertEmails) {
    console.log("[ALERT] No ALERT_EMAILS configured, skipping email alert");
    return;
  }

  // In a real implementation, use nodemailer or similar
  // For now, just log
  console.log("[ALERT] Email alert would be sent to:", alertEmails);
  console.log("[ALERT] Message:", message);

  // TODO: Implement actual email sending
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({
  //   from: process.env.ALERT_FROM_EMAIL,
  //   to: alertEmails,
  //   subject: `🚨 Critical Error: ${context.endpoint || 'System'}`,
  //   text: message,
  // });
}

/**
 * Send Slack alert (if configured)
 */
async function sendSlackAlert(message: string, context: any) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    console.log("[ALERT] No SLACK_WEBHOOK_URL configured, skipping Slack alert");
    return;
  }

  try {
    const response = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        username: "Break Agency Monitor",
        icon_emoji: ":rotating_light:",
      }),
    });

    if (!response.ok) {
      console.error("[ALERT] Failed to send Slack alert:", response.statusText);
    } else {
      console.log("[ALERT] Slack alert sent successfully");
    }
  } catch (error) {
    console.error("[ALERT] Error sending Slack alert:", error);
  }
}

/**
 * Send daily error summary
 */
export async function sendDailyErrorSummary() {
  const errorLog = (global as any).errorLog || [];

  if (errorLog.length === 0) {
    console.log("[ALERT] No errors in the last 24 hours");
    return;
  }

  // Group errors by type
  const errorsByType: { [key: string]: number } = {};
  errorLog.forEach((error: any) => {
    const errorType = error.code || error.message?.substring(0, 50) || "Unknown";
    errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
  });

  // Format summary
  let summary = "📊 **Daily Error Summary**\n\n";
  summary += `**Total Errors:** ${errorLog.length}\n\n`;
  summary += "**Breakdown by Type:**\n";

  Object.entries(errorsByType)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .forEach(([type, count]) => {
      summary += `- ${type}: ${count} occurrences\n`;
    });

  summary += `\n**Environment:** ${process.env.NODE_ENV || "development"}`;
  summary += `\n**Timestamp:** ${new Date().toISOString()}`;

  // Send to configured channels
  await Promise.allSettled([
    sendEmailAlert(summary, { endpoint: "Daily Summary" }),
    sendSlackAlert(summary, { endpoint: "Daily Summary" }),
  ]);

  // Clear error log after sending summary
  (global as any).errorLog = [];
}

/**
 * Log error to daily summary
 */
export function logErrorForSummary(error: any) {
  if (!(global as any).errorLog) {
    (global as any).errorLog = [];
  }

  const sanitizedError = sanitizeErrorForLogging(error);
  (global as any).errorLog.push(sanitizedError);

  // Keep only last 1000 errors to prevent memory bloat
  if ((global as any).errorLog.length > 1000) {
    (global as any).errorLog = (global as any).errorLog.slice(-1000);
  }
}

export default {
  sendAlert,
  sendDailyErrorSummary,
  logErrorForSummary,
};

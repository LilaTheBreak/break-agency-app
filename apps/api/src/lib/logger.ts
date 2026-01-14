import { sendSlackAlert } from '../integrations/slack/slackClient.js';

export function logInfo(message: string, meta: Record<string, unknown> = {}) {
  console.log("[INFO]", message, meta);
}

export function logWarn(message: string, meta: Record<string, unknown> = {}) {
  console.warn("[WARN]", message, meta);
}

export function logError(message: string, error?: unknown, meta: Record<string, unknown> = {}) {
  console.error("[ERROR]", message, { error, ...meta });
}

export async function logCritical(
  message: string,
  error: unknown,
  meta: Record<string, unknown> = {}
) {
  console.error("[CRITICAL]", message, { error, ...meta });
  await sendSlackAlert(message, { error: `${error}`, ...meta });
}

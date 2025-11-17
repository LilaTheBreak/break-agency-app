export function logInfo(message: string, data?: Record<string, unknown>) {
  console.log(`[INFO] ${message}`, data || "");
}

export function logError(message: string, error: unknown, data?: Record<string, unknown>) {
  console.error(`[ERROR] ${message}`, { error, ...(data || {}) });
}

export function logWarn(message: string, data?: Record<string, unknown>) {
  console.warn(`[WARN] ${message}`, data || "");
}

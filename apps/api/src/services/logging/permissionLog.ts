/**
 * Permission logging service
 */

export async function logPermission(userId: string, feature: string, granted: boolean) {
  console.log(`[PermissionLog] User ${userId} - Feature ${feature} - Granted: ${granted}`);
}

export async function logPermissionDenial(userId: string, feature: string, reason?: string) {
  console.log(`[PermissionLog] User ${userId} - Feature ${feature} - DENIED. Reason: ${reason || "unknown"}`);
}


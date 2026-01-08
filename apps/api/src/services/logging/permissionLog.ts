/**
 * Permission logging service
 */

export async function logPermission(userId: string, feature: string, granted: boolean) {
  console.log(`[PermissionLog] User ${userId} - Feature ${feature} - Granted: ${granted}`);
}

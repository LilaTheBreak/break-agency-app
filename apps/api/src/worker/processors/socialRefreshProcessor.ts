// Phase 3: Fail loudly - social refresh is disabled but queue exists
export default async function socialRefreshProcessor(job: any) {
  const error = new Error("socialRefreshProcessor disabled: social schema models removed from active use");
  console.error("[WORKER ERROR] social-refresh job failed:", error);
  throw error; // Fail loudly so BullMQ can handle retry/cleanup
}

/**
 * Fire-and-forget async initialization helper
 * Prevents blocking server startup on failed initialization
 * 
 * ⚠️ Do not await this. Ever.
 */
export function safeAsync(
  name: string,
  fn: () => Promise<any>
) {
  fn()
    .then(() => {
      console.log(`[BOOT] ${name} initialized`);
    })
    .catch((err) => {
      console.error(`[BOOT] ${name} failed (non-blocking):`, err.message);
    });
}

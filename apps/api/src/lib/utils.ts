import { createId } from '@paralleldrive/cuid2';

/**
 * Generate a unique identifier using CUID2
 */
export function generateId(): string {
  return createId();
}

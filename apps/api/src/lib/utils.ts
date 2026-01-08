import { createId } from '@paralleldrive/cuid2';

/**
 * Generate a unique identifier using CUID2
 * @param prefix Optional prefix to prepend to the ID
 */
export function generateId(prefix?: string): string {
  const id = createId();
  return prefix ? `${prefix}_${id}` : id;
}

type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

export class TTLCache<T = unknown> {
  private store = new Map<string, CacheValue<T>>();

  constructor(private defaultTtlMs = 1000 * 60 * 5) {}

  set(key: string, value: T, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

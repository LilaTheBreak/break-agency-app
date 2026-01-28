import Redis from "ioredis";

// Check if Redis should be enabled (optional in dev mode)
const isRedisEnabled = process.env.REDIS_URL || process.env.REDIS_HOST;
const isDev = process.env.NODE_ENV !== 'production';

let redis: any;

if (isRedisEnabled) {
  // Initialize Redis client with environment variables or defaults
  redis = new (Redis as any)({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    lazyConnect: true, // Don't connect immediately
  });

  // Graceful error handling
  redis.on("error", (err: Error) => {
    if (isDev) {
      console.warn("[REDIS] Connection error (non-blocking in dev):", err.message);
    } else {
      console.error("[REDIS] Connection error:", err);
    }
    // Don't throw - allow app to continue without caching
  });

  redis.on("connect", () => {
    console.log("[REDIS] Connected to Redis");
  });

  redis.on("disconnect", () => {
    console.log("[REDIS] Disconnected from Redis");
  });

  // Try to connect but don't fail if it doesn't work
  redis.connect().catch((err: Error) => {
    if (isDev) {
      console.warn("[REDIS] ⚠️  Redis not available - caching disabled (non-blocking)");
    } else {
      console.error("[REDIS] Failed to connect:", err);
    }
  });
} else {
  // Mock Redis client that does nothing (no-op)
  console.log("[REDIS] ⚠️  Redis not configured - using no-op mock (caching disabled)");
  redis = {
    get: async () => null,
    set: async () => "OK",
    setex: async () => "OK",
    del: async () => 1,
    exists: async () => 0,
    expire: async () => 1,
    ttl: async () => -1,
    keys: async () => [],
    flushall: async () => "OK",
    quit: async () => "OK",
    on: () => {},
    connect: async () => {},
    disconnect: async () => {},
  };
}

export default redis;

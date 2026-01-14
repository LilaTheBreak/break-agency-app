import Redis from "ioredis";

// Initialize Redis client with environment variables or defaults
const redis = new (Redis as any)({
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
});

// Graceful error handling
redis.on("error", (err: Error) => {
  console.error("[REDIS] Connection error:", err);
  // Don't throw - allow app to continue without caching
});

redis.on("connect", () => {
  console.log("[REDIS] Connected to Redis");
});

redis.on("disconnect", () => {
  console.log("[REDIS] Disconnected from Redis");
});

export default redis;

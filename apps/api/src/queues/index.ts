import { Queue } from "bullmq";
import { safeEnv } from '../utils/safeEnv.js';

const redisHost = safeEnv("REDIS_HOST", "");
const redisPort = Number(safeEnv("REDIS_PORT", "6379"));
const redisUrl = safeEnv("REDIS_URL", "");
const nodeEnv = safeEnv("NODE_ENV", "development");

// Only use real queues if Redis is explicitly configured via REDIS_URL or REDIS_HOST
const hasRedisConfigured = !!(redisUrl || redisHost);
const shouldStubQueues = !hasRedisConfigured;

if (!hasRedisConfigured) {
  console.log("[QUEUE] No Redis configured - using stub queues");
} else {
  console.log(`[QUEUE] Redis configured - using real queues at ${redisUrl || `${redisHost}:${redisPort}`}`);
}

function buildStubQueue(name: string) {
  console.log(`[QUEUE STUB] ${name}`);
  return {
    add: async () => { console.log(`[QUEUE STUB] add to ${name}`); return { id: 'stub' }; },
    getFailed: async () => [],
    getJobs: async () => [],
    getJobCounts: async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })
  };
}

export function createSafeQueue(name: string) {
  if (shouldStubQueues) {
    return buildStubQueue(name);
  }

  try {
    const connectionOptions = redisUrl 
      ? { url: redisUrl }
      : { host: redisHost, port: redisPort };
      
    return new Queue(name, {
      connection: connectionOptions
    });
  } catch (err) {
    console.warn(`[QUEUE] Failed to create ${name}, falling back to stub:`, err);
    return buildStubQueue(name);
  }
}

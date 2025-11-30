import { Queue } from "bullmq";
import { safeEnv } from "../utils/safeEnv.js";

const redisHost = safeEnv("REDIS_HOST", "127.0.0.1");
const redisPort = Number(safeEnv("REDIS_PORT", "6379"));
const nodeEnv = safeEnv("NODE_ENV", "development");
const shouldStubQueues = nodeEnv !== "production";

function buildStubQueue(name: string) {
  console.log(`[QUEUE STUB] ${name}`);
  return {
    add: async () => console.log(`[QUEUE STUB] add to ${name}`),
    getFailed: async () => []
  };
}

export function createSafeQueue(name: string) {
  if (shouldStubQueues) {
    return buildStubQueue(name);
  }

  try {
    return new Queue(name, {
      connection: {
        host: redisHost,
        port: redisPort
      }
    });
  } catch (err) {
    console.warn(`[QUEUE STUB] ${name}`, err);
    return buildStubQueue(name);
  }
}

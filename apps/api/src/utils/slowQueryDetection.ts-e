/**
 * Slow Query Detection and Logging Middleware
 * 
 * Automatically detects and logs slow database queries for optimization.
 * Integrates with Prisma to capture query performance metrics.
 */

import { PrismaClient } from '@prisma/client';

// Slow query threshold (milliseconds)
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

interface SlowQueryLog {
  timestamp: Date;
  query: string;
  duration: number;
  params?: any;
  model?: string;
  operation?: string;
}

/**
 * Initialize slow query logging on Prisma client
 */
export function initializeSlowQueryLogging(prisma: PrismaClient) {
  // Initialize slow query log in global state
  if (!(global as any).slowQueryLog) {
    (global as any).slowQueryLog = [];
  }

  // Prisma query event logging
  prisma.$on('query' as never, async (e: any) => {
    const duration = e.duration || 0;

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      const slowQuery: SlowQueryLog = {
        timestamp: new Date(),
        query: e.query || 'Unknown query',
        duration,
        params: e.params,
        model: e.target,
      };

      // Add to global log (keep last 100 slow queries)
      const log = (global as any).slowQueryLog;
      log.push(slowQuery);
      if (log.length > 100) {
        log.shift();
      }

      // Console warning for very slow queries (>2s)
      if (duration > 2000) {
        console.warn(`⚠️ VERY SLOW QUERY (${duration}ms):`, {
          query: e.query?.substring(0, 100),
          target: e.target,
        });
      } else {
        console.warn(`⚠️ Slow query (${duration}ms):`, {
          query: e.query?.substring(0, 100),
          target: e.target,
        });
      }
    }
  });

  console.log('[MONITORING] Slow query logging initialized (threshold: 1000ms)');
}

/**
 * Get slow query statistics
 */
export function getSlowQueryStats(): {
  totalSlowQueries: number;
  averageDuration: number;
  slowestQuery: SlowQueryLog | null;
  byModel: Record<string, number>;
  recentSlowQueries: SlowQueryLog[];
} {
  const slowQueryLog = (global as any).slowQueryLog || [];

  if (slowQueryLog.length === 0) {
    return {
      totalSlowQueries: 0,
      averageDuration: 0,
      slowestQuery: null,
      byModel: {},
      recentSlowQueries: [],
    };
  }

  // Calculate average duration
  const totalDuration = slowQueryLog.reduce((sum: number, q: SlowQueryLog) => sum + q.duration, 0);
  const averageDuration = Math.round(totalDuration / slowQueryLog.length);

  // Find slowest query
  const slowestQuery = slowQueryLog.reduce((slowest: SlowQueryLog, q: SlowQueryLog) =>
    q.duration > slowest.duration ? q : slowest
  );

  // Count by model
  const byModel: Record<string, number> = {};
  for (const query of slowQueryLog) {
    const model = query.model || 'Unknown';
    byModel[model] = (byModel[model] || 0) + 1;
  }

  // Get last 10 slow queries
  const recentSlowQueries = slowQueryLog.slice(-10);

  return {
    totalSlowQueries: slowQueryLog.length,
    averageDuration,
    slowestQuery,
    byModel,
    recentSlowQueries,
  };
}

/**
 * Express middleware to track request duration
 */
export function requestDurationMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  // Initialize request log in global state
  if (!(global as any).requestLog) {
    (global as any).requestLog = [];
  }

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.path}`;

    // Log all requests
    const log = (global as any).requestLog;
    log.push({
      timestamp: new Date(),
      endpoint,
      method: req.method,
      path: req.path,
      duration,
      statusCode: res.statusCode,
      userId: req.user?.id,
    });

    // Keep last 1000 requests
    if (log.length > 1000) {
      log.shift();
    }

    // Warn on slow requests (>2s)
    if (duration > 2000) {
      console.warn(`⚠️ Slow request (${duration}ms): ${endpoint}`);
    }
  });

  next();
}

/**
 * Memory tracking middleware
 * Samples memory usage periodically
 */
export function startMemoryTracking(intervalMs: number = 60000) {
  // Initialize memory log
  if (!(global as any).memoryLog) {
    (global as any).memoryLog = [];
  }

  setInterval(() => {
    const memory = process.memoryUsage();
    const log = (global as any).memoryLog;

    log.push({
      timestamp: new Date(),
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    });

    // Keep last 100 samples (100 minutes if sampling every minute)
    if (log.length > 100) {
      log.shift();
    }

    // Warn if heap usage > 500MB
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      console.warn(`⚠️ High memory usage: ${Math.round(heapUsedMB)}MB heap used`);
    }
  }, intervalMs);

  console.log(`[MONITORING] Memory tracking started (interval: ${intervalMs}ms)`);
}

/**
 * Database connection pool monitoring
 */
export function monitorConnectionPool(prisma: PrismaClient) {
  setInterval(async () => {
    try {
      // Get pool metrics (if available)
      const metrics = await (prisma as any).$metrics?.json();
      
      if (metrics) {
        const poolMetrics = metrics.counters?.find((c: any) => c.key === 'prisma_pool_connections_open');
        const openConnections = poolMetrics?.value || 0;

        // Warn if approaching connection limit
        const CONNECTION_LIMIT = 10; // Default Prisma pool size
        if (openConnections > CONNECTION_LIMIT * 0.8) {
          console.warn(`⚠️ Connection pool usage high: ${openConnections}/${CONNECTION_LIMIT}`);
        }
      }
    } catch (error) {
      // Metrics might not be available in all Prisma versions
      // Silently fail
    }
  }, 60000); // Check every minute

  console.log('[MONITORING] Connection pool monitoring started');
}

/**
 * Query optimization suggestions based on slow query patterns
 */
export function getSuggestedOptimizations(): Array<{
  model: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const stats = getSlowQueryStats();
  const suggestions: Array<{
    model: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  // Analyze queries by model
  for (const [model, count] of Object.entries(stats.byModel)) {
    if (count > 5) {
      suggestions.push({
        model,
        issue: `${count} slow queries detected on ${model} model`,
        suggestion: `Add database indexes on frequently queried fields for ${model}`,
        priority: count > 10 ? 'high' : 'medium',
      });
    }
  }

  // Check for very slow queries
  if (stats.slowestQuery && stats.slowestQuery.duration > 3000) {
    suggestions.push({
      model: stats.slowestQuery.model || 'Unknown',
      issue: `Extremely slow query detected (${stats.slowestQuery.duration}ms)`,
      suggestion: 'Review and optimize this query immediately, consider adding indexes or rewriting',
      priority: 'high',
    });
  }

  // Check average duration
  if (stats.averageDuration > 1500) {
    suggestions.push({
      model: 'General',
      issue: `Average slow query duration is ${stats.averageDuration}ms`,
      suggestion: 'Review overall database performance, consider query optimization and caching',
      priority: 'medium',
    });
  }

  return suggestions;
}

export default {
  initializeSlowQueryLogging,
  getSlowQueryStats,
  requestDurationMiddleware,
  startMemoryTracking,
  monitorConnectionPool,
  getSuggestedOptimizations,
};

/**
 * Error Log Analysis Utilities
 * 
 * Analyzes production error logs to identify patterns, trends, and issues
 * requiring attention. Data-driven approach to platform hardening.
 */

interface ErrorLog {
  timestamp: Date;
  error: string;
  errorCode?: string;
  endpoint?: string;
  userId?: string;
  statusCode?: number;
  duration?: number;
}

interface ErrorAnalysis {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  errorTrends: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  topErrors: Array<{
    error: string;
    count: number;
    firstSeen: Date;
    lastSeen: Date;
  }>;
  criticalErrors: Array<{
    error: string;
    endpoint: string;
    timestamp: Date;
  }>;
}

/**
 * Analyze error logs from global error accumulator
 */
export function analyzeErrorLogs(): ErrorAnalysis {
  const errorLog = (global as any).errorLog || [];
  
  if (errorLog.length === 0) {
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByEndpoint: {},
      errorTrends: { last24Hours: 0, last7Days: 0, last30Days: 0 },
      topErrors: [],
      criticalErrors: [],
    };
  }

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count errors by type
  const errorsByType: Record<string, number> = {};
  const errorsByEndpoint: Record<string, number> = {};
  const errorCounts: Record<string, { count: number; firstSeen: Date; lastSeen: Date }> = {};

  let errors24h = 0;
  let errors7d = 0;
  let errors30d = 0;

  const criticalErrors: Array<{ error: string; endpoint: string; timestamp: Date }> = [];

  for (const log of errorLog) {
    const timestamp = new Date(log.timestamp);
    const errorKey = log.error || log.message || 'Unknown error';
    
    // Count by type
    const errorType = log.errorCode || log.statusCode || 'Unknown';
    errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

    // Count by endpoint
    if (log.endpoint) {
      errorsByEndpoint[log.endpoint] = (errorsByEndpoint[log.endpoint] || 0) + 1;
    }

    // Track error occurrences
    if (!errorCounts[errorKey]) {
      errorCounts[errorKey] = { count: 0, firstSeen: timestamp, lastSeen: timestamp };
    }
    errorCounts[errorKey].count++;
    errorCounts[errorKey].lastSeen = timestamp;

    // Time-based counts
    if (timestamp >= last24Hours) errors24h++;
    if (timestamp >= last7Days) errors7d++;
    if (timestamp >= last30Days) errors30d++;

    // Identify critical errors (5xx, database errors, etc.)
    if (
      log.statusCode >= 500 ||
      errorKey.includes('database') ||
      errorKey.includes('ECONNREFUSED') ||
      errorKey.includes('ETIMEDOUT')
    ) {
      criticalErrors.push({
        error: errorKey,
        endpoint: log.endpoint || 'unknown',
        timestamp,
      });
    }
  }

  // Get top 10 errors by count
  const topErrors = Object.entries(errorCounts)
    .map(([error, data]) => ({ error, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalErrors: errorLog.length,
    errorsByType,
    errorsByEndpoint,
    errorTrends: {
      last24Hours: errors24h,
      last7Days: errors7d,
      last30Days: errors30d,
    },
    topErrors,
    criticalErrors: criticalErrors.slice(-20), // Last 20 critical errors
  };
}

/**
 * Get slow query analysis
 * Identifies endpoints with high response times
 */
export function analyzeSlowQueries(): {
  slowEndpoints: Array<{
    endpoint: string;
    avgDuration: number;
    maxDuration: number;
    count: number;
  }>;
  threshold: number;
} {
  const requestLog = (global as any).requestLog || [];
  
  if (requestLog.length === 0) {
    return { slowEndpoints: [], threshold: 1000 };
  }

  // Group by endpoint
  const endpointStats: Record<string, { durations: number[]; count: number }> = {};

  for (const log of requestLog) {
    if (!log.endpoint || !log.duration) continue;

    if (!endpointStats[log.endpoint]) {
      endpointStats[log.endpoint] = { durations: [], count: 0 };
    }
    endpointStats[log.endpoint].durations.push(log.duration);
    endpointStats[log.endpoint].count++;
  }

  // Calculate averages and identify slow endpoints
  const SLOW_THRESHOLD = 1000; // 1 second
  const slowEndpoints = Object.entries(endpointStats)
    .map(([endpoint, stats]) => {
      const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;
      const maxDuration = Math.max(...stats.durations);
      return {
        endpoint,
        avgDuration: Math.round(avgDuration),
        maxDuration: Math.round(maxDuration),
        count: stats.count,
      };
    })
    .filter(stat => stat.avgDuration > SLOW_THRESHOLD || stat.maxDuration > SLOW_THRESHOLD * 2)
    .sort((a, b) => b.avgDuration - a.avgDuration);

  return {
    slowEndpoints,
    threshold: SLOW_THRESHOLD,
  };
}

/**
 * Get endpoint usage statistics
 * Identifies hot paths that need optimization
 */
export function analyzeEndpointUsage(): {
  hotPaths: Array<{
    endpoint: string;
    count: number;
    avgDuration: number;
    errorRate: number;
  }>;
} {
  const requestLog = (global as any).requestLog || [];
  const errorLog = (global as any).errorLog || [];

  if (requestLog.length === 0) {
    return { hotPaths: [] };
  }

  // Count requests and errors by endpoint
  const endpointStats: Record<
    string,
    { count: number; durations: number[]; errors: number }
  > = {};

  for (const log of requestLog) {
    if (!log.endpoint) continue;

    if (!endpointStats[log.endpoint]) {
      endpointStats[log.endpoint] = { count: 0, durations: [], errors: 0 };
    }
    endpointStats[log.endpoint].count++;
    if (log.duration) {
      endpointStats[log.endpoint].durations.push(log.duration);
    }
  }

  // Count errors per endpoint
  for (const log of errorLog) {
    if (log.endpoint && endpointStats[log.endpoint]) {
      endpointStats[log.endpoint].errors++;
    }
  }

  // Calculate hot paths (most used endpoints)
  const hotPaths = Object.entries(endpointStats)
    .map(([endpoint, stats]) => {
      const avgDuration =
        stats.durations.length > 0
          ? stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
          : 0;
      const errorRate = stats.count > 0 ? (stats.errors / stats.count) * 100 : 0;

      return {
        endpoint,
        count: stats.count,
        avgDuration: Math.round(avgDuration),
        errorRate: Math.round(errorRate * 100) / 100,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 hot paths

  return { hotPaths };
}

/**
 * Get memory usage trends
 * Identifies potential memory leaks
 */
export function analyzeMemoryUsage(): {
  current: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  trend: 'stable' | 'increasing' | 'decreasing';
  warning: boolean;
} {
  const memoryLog = (global as any).memoryLog || [];
  const current = process.memoryUsage();

  if (memoryLog.length < 10) {
    return {
      current: {
        rss: Math.round(current.rss / 1024 / 1024),
        heapTotal: Math.round(current.heapTotal / 1024 / 1024),
        heapUsed: Math.round(current.heapUsed / 1024 / 1024),
        external: Math.round(current.external / 1024 / 1024),
      },
      trend: 'stable',
      warning: false,
    };
  }

  // Analyze last 10 memory samples
  const recent = memoryLog.slice(-10);
  const first = recent[0].heapUsed;
  const last = recent[recent.length - 1].heapUsed;
  const change = ((last - first) / first) * 100;

  let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
  if (change > 10) trend = 'increasing';
  else if (change < -10) trend = 'decreasing';

  // Warning if heap used > 500MB or increasing rapidly
  const warning = current.heapUsed / 1024 / 1024 > 500 || (trend === 'increasing' && change > 20);

  return {
    current: {
      rss: Math.round(current.rss / 1024 / 1024),
      heapTotal: Math.round(current.heapTotal / 1024 / 1024),
      heapUsed: Math.round(current.heapUsed / 1024 / 1024),
      external: Math.round(current.external / 1024 / 1024),
    },
    trend,
    warning,
  };
}

/**
 * Generate hardening recommendations based on analysis
 */
export function generateHardeningRecommendations(): {
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'errors' | 'security' | 'reliability';
    issue: string;
    recommendation: string;
  }>;
} {
  const errorAnalysis = analyzeErrorLogs();
  const slowQueries = analyzeSlowQueries();
  const endpointUsage = analyzeEndpointUsage();
  const memoryAnalysis = analyzeMemoryUsage();

  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'errors' | 'security' | 'reliability';
    issue: string;
    recommendation: string;
  }> = [];

  // High error rate
  if (errorAnalysis.errorTrends.last24Hours > 50) {
    recommendations.push({
      priority: 'high',
      category: 'errors',
      issue: `High error rate: ${errorAnalysis.errorTrends.last24Hours} errors in last 24 hours`,
      recommendation: 'Review error logs and fix top recurring errors',
    });
  }

  // Critical errors present
  if (errorAnalysis.criticalErrors.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'reliability',
      issue: `${errorAnalysis.criticalErrors.length} critical errors detected`,
      recommendation: 'Address database connection issues and 5xx errors immediately',
    });
  }

  // Slow endpoints
  if (slowQueries.slowEndpoints.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      issue: `${slowQueries.slowEndpoints.length} slow endpoints detected (>${slowQueries.threshold}ms)`,
      recommendation: 'Optimize database queries and add caching to slow endpoints',
    });
  }

  // Hot paths with high error rates
  const problematicHotPaths = endpointUsage.hotPaths.filter(hp => hp.errorRate > 5);
  if (problematicHotPaths.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'reliability',
      issue: `${problematicHotPaths.length} frequently-used endpoints have >5% error rate`,
      recommendation: 'Stabilize hot paths to improve overall platform reliability',
    });
  }

  // Memory warnings
  if (memoryAnalysis.warning) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      issue: `Memory usage ${memoryAnalysis.trend} (current: ${memoryAnalysis.current.heapUsed}MB)`,
      recommendation: 'Investigate potential memory leaks and optimize memory-intensive operations',
    });
  }

  // Medium priority: Optimize hot paths
  const highTrafficPaths = endpointUsage.hotPaths.filter(hp => hp.count > 100);
  if (highTrafficPaths.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      issue: `${highTrafficPaths.length} endpoints receiving high traffic (>100 requests)`,
      recommendation: 'Add caching and optimize hot paths to improve response times',
    });
  }

  // Rate limiting recommendation
  const authEndpoints = endpointUsage.hotPaths.filter(hp =>
    hp.endpoint.includes('/auth') || hp.endpoint.includes('/login')
  );
  if (authEndpoints.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'security',
      issue: 'Auth endpoints lack rate limiting',
      recommendation: 'Add rate limiting to auth endpoints to prevent brute force attacks',
    });
  }

  return { recommendations };
}

export default {
  analyzeErrorLogs,
  analyzeSlowQueries,
  analyzeEndpointUsage,
  analyzeMemoryUsage,
  generateHardeningRecommendations,
};

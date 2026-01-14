/**
 * Admin Performance Dashboard API
 * 
 * Exposes performance metrics, error analysis, and hardening recommendations
 * to admin users for data-driven optimization decisions.
 */

import { Router } from 'express';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { analyzeErrorLogs, analyzeSlowQueries, analyzeEndpointUsage, analyzeMemoryUsage, generateHardeningRecommendations } from '../../utils/errorAnalysis.js';
import { getSlowQueryStats, getSuggestedOptimizations } from '../../utils/slowQueryDetection.js';

const router = Router();

/**
 * GET /api/admin/performance
 * 
 * Returns comprehensive performance analysis including:
 * - Error logs analysis (trends, top errors, critical errors)
 * - Slow query detection (database performance)
 * - Endpoint usage patterns (hot paths)
 * - Memory usage trends
 * - Rate limiting statistics
 * - Auto-generated hardening recommendations
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    console.log('[PERFORMANCE] Generating performance dashboard...');

    // Gather all performance metrics
    const errorAnalysis = analyzeErrorLogs();
    const slowQueries = getSlowQueryStats();
    const endpointUsageResult = analyzeEndpointUsage();
    const slowQueriesResult = analyzeSlowQueries();
    const memoryUsage = analyzeMemoryUsage();
    const recommendationsResult = generateHardeningRecommendations();
    const optimizationsResult = getSuggestedOptimizations();

    // Combine into comprehensive dashboard
    const dashboard = {
      timestamp: new Date().toISOString(),
      
      // Error analysis
      errors: {
        total: errorAnalysis.totalErrors,
        byType: errorAnalysis.errorsByType,
        byEndpoint: errorAnalysis.errorsByEndpoint,
        trends: errorAnalysis.errorTrends,
        topErrors: errorAnalysis.topErrors,
        criticalErrors: errorAnalysis.criticalErrors,
      },

      // Performance metrics
      performance: {
        slowQueries: {
          total: slowQueries.totalSlowQueries,
          average: slowQueries.averageDuration,
          slowest: slowQueries.slowestQuery,
          byModel: slowQueries.byModel,
          recent: slowQueries.recentSlowQueries,
        },
        endpoints: {
          hotPaths: endpointUsageResult.hotPaths.slice(0, 10), // Top 10 hot paths
          slow: slowQueriesResult.slowEndpoints.slice(0, 10), // Top 10 slow endpoints
        },
      },

      // Resource usage
      resources: {
        memory: {
          current: memoryUsage.current,
          trend: memoryUsage.trend,
          warning: memoryUsage.warning,
        },
      },

      // Recommendations
      recommendations: {
        hardening: recommendationsResult.recommendations,
        optimizations: optimizationsResult,
      },

      // Summary
      summary: {
        totalIssues: recommendationsResult.recommendations.length + optimizationsResult.length,
        highPriority: recommendationsResult.recommendations.filter(r => r.priority === 'high').length,
        mediumPriority: recommendationsResult.recommendations.filter(r => r.priority === 'medium').length,
        lowPriority: recommendationsResult.recommendations.filter(r => r.priority === 'low').length,
        healthStatus: getHealthStatus(errorAnalysis, slowQueries, memoryUsage),
      },
    };

    console.log('[PERFORMANCE] Dashboard generated successfully');
    console.log(`[PERFORMANCE] Found ${dashboard.summary.totalIssues} recommendations (${dashboard.summary.highPriority} high priority)`);

    res.json(dashboard);
  } catch (error) {
    console.error('[PERFORMANCE] Failed to generate dashboard:', error);
    res.status(500).json({
      error: 'Failed to generate performance dashboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/performance/errors
 * 
 * Returns detailed error analysis only
 */
router.get('/errors', requireAdmin, (req, res) => {
  try {
    const analysis = analyzeErrorLogs();
    res.json(analysis);
  } catch (error) {
    console.error('[PERFORMANCE] Failed to analyze errors:', error);
    res.status(500).json({
      error: 'Failed to analyze errors',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/performance/queries
 * 
 * Returns slow query analysis only
 */
router.get('/queries', requireAdmin, (req, res) => {
  try {
    const stats = getSlowQueryStats();
    const optimizations = getSuggestedOptimizations();
    
    res.json({
      stats,
      optimizations,
    });
  } catch (error) {
    console.error('[PERFORMANCE] Failed to analyze queries:', error);
    res.status(500).json({
      error: 'Failed to analyze queries',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/performance/endpoints
 * 
 * Returns endpoint usage analysis only
 */
router.get('/endpoints', requireAdmin, (req, res) => {
  try {
    const usage = analyzeEndpointUsage();
    const slow = analyzeSlowQueries();
    
    res.json({
      hotPaths: usage.hotPaths,
      slowEndpoints: slow.slowEndpoints,
    });
  } catch (error) {
    console.error('[PERFORMANCE] Failed to analyze endpoints:', error);
    res.status(500).json({
      error: 'Failed to analyze endpoints',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/performance/memory
 * 
 * Returns memory usage analysis only
 */
router.get('/memory', requireAdmin, (req, res) => {
  try {
    const analysis = analyzeMemoryUsage();
    res.json(analysis);
  } catch (error) {
    console.error('[PERFORMANCE] Failed to analyze memory:', error);
    res.status(500).json({
      error: 'Failed to analyze memory',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/performance/recommendations
 * 
 * Returns hardening recommendations only
 */
router.get('/recommendations', requireAdmin, (req, res) => {
  try {
    const hardening = generateHardeningRecommendations();
    const optimizations = getSuggestedOptimizations();
    
    res.json({
      hardening: hardening.recommendations,
      optimizations,
      summary: {
        total: hardening.recommendations.length + optimizations.length,
        highPriority: hardening.recommendations.filter(r => r.priority === 'high').length,
        mediumPriority: hardening.recommendations.filter(r => r.priority === 'medium').length,
        lowPriority: hardening.recommendations.filter(r => r.priority === 'low').length,
      },
    });
  } catch (error) {
    console.error('[PERFORMANCE] Failed to generate recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Determine overall health status based on metrics
 */
function getHealthStatus(errorAnalysis: any, slowQueries: any, memoryUsage: any): 'healthy' | 'warning' | 'critical' {
  // Critical: High error rate, many slow queries, or memory issues
  if (
    errorAnalysis.errorTrends.last24Hours > 100 ||
    errorAnalysis.criticalErrors.length > 10 ||
    slowQueries.totalSlowQueries > 50 ||
    memoryUsage.warning
  ) {
    return 'critical';
  }

  // Warning: Moderate error rate or some slow queries
  if (
    errorAnalysis.errorTrends.last24Hours > 50 ||
    slowQueries.totalSlowQueries > 20 ||
    errorAnalysis.criticalErrors.length > 5
  ) {
    return 'warning';
  }

  // Healthy: Low error rate and good performance
  return 'healthy';
}

export default router;

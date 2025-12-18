import { useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient.js';

/**
 * Custom hook for fetching analytics data
 * @param {string} endpoint - Analytics endpoint (e.g., 'revenue', 'metrics', 'socials')
 * @param {object} params - Query parameters (e.g., { period: 'Month' })
 * @param {object} options - Hook options (e.g., { autoRefresh: false })
 */
export function useAnalytics(endpoint, params = {}, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryString = new URLSearchParams(params).toString();
      const url = `/analytics/${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiFetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint} analytics`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`[useAnalytics ${endpoint}]`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Optional auto-refresh
    if (options.autoRefresh) {
      const interval = setInterval(fetchData, options.refreshInterval || 120000); // 2 minutes default
      return () => clearInterval(interval);
    }
  }, [endpoint, JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Hook specifically for revenue analytics with time period support
 */
export function useRevenue(period = 'Month') {
  return useAnalytics('revenue', { period });
}

/**
 * Hook for performance metrics
 */
export function useMetrics() {
  return useAnalytics('metrics');
}

/**
 * Hook for social analytics
 */
export function useSocials() {
  return useAnalytics('socials');
}

/**
 * Hook for growth analytics with time period support
 */
export function useGrowth(period = '90d') {
  return useAnalytics('growth', { period });
}

/**
 * Hook for performance analytics
 */
export function usePerformance() {
  return useAnalytics('performance');
}

/**
 * Hook for AI insights
 */
export function useInsights() {
  return useAnalytics('insights');
}

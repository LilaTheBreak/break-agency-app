import React, { useState, useCallback, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import { BarChart3, Filter, Download, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import ProfileInputSelector from "../components/Analytics/ProfileInputSelector.jsx";
import AnalyticsOverviewIntelligence from "../components/Analytics/AnalyticsOverviewIntelligence.jsx";
import AnalyticsContentPerformance from "../components/Analytics/AnalyticsContentPerformance.jsx";
import AnalyticsAudienceHealth from "../components/Analytics/AnalyticsAudienceHealth.jsx";
import AnalyticsKeywordsThemes from "../components/Analytics/AnalyticsKeywordsThemes.jsx";
import AdminNotesAnalytics from "../components/Analytics/AdminNotesAnalytics.jsx";

/**
 * AdminAnalyticsPage
 * 
 * Global analytics command centre for analyzing any social profile:
 * - Existing talent in the CRM
 * - Connected social profiles
 * - External profiles (paste any social URL)
 * 
 * Reuses existing Social Intelligence infrastructure and extends with
 * premium UI, deep insights, comparison mode, and admin notes.
 */
export function AdminAnalyticsPage({ session }) {
  // State management
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("30d");
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonProfile, setComparisonProfile] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataFreshness, setDataFreshness] = useState(null);

  /**
   * Fetch analytics data for a selected profile
   */
  const handleFetchAnalytics = useCallback(async (profile) => {
    try {
      setLoading(true);
      setError(null);
      
      // DEBUG: Profile selected
      console.log("[ANALYTICS_DEBUG] Profile selected:", {
        type: profile.type,
        id: profile.id,
        platform: profile.platform,
        handle: profile.handle,
        url: profile.url,
        timestamp: new Date().toISOString(),
      });
      
      let body = {};
      
      // Build request body based on profile type
      if (profile.type === "talent") {
        body.talentId = profile.id;
      } else if (profile.type === "connected") {
        body.talentId = profile.id;
      } else if (profile.type === "external") {
        // External profile: send URL
        body.url = profile.url || `${profile.platform}/${profile.handle}`;
      }
      
      // DEBUG: Request body built
      console.log("[ANALYTICS_DEBUG] Request body:", body);
      
      // Use POST /analyze endpoint for talent and external profiles
      // Only use GET for legacy connected profiles that have a specific profileId
      if (profile.type === "talent" || profile.type === "external" || !profile.id) {
        console.log("[ANALYTICS_DEBUG] Using POST /api/admin/analytics/analyze endpoint");
        
        const response = await apiFetch("/api/admin/analytics/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        
        console.log("[ANALYTICS_DEBUG] API Response received:", {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });
        
        const data = await response.json();
        
        console.log("[ANALYTICS_DEBUG] API Response data:", {
          keys: Object.keys(data),
          overview: data?.overview,
          error: data?.error,
          details: data?.details,
          syncStatus: data?.syncStatus,
        });
        
        if (!response.ok) {
          const errorMsg = data?.details || data?.error || response.statusText || "Failed to fetch analytics";
          console.error("[ANALYTICS_DEBUG] API Error:", {
            errorMsg,
            status: response.status,
            fullError: data,
          });
          throw new Error(errorMsg);
        }
        
        setAnalyticsData(data);
        setDataFreshness(new Date());
        setSelectedProfile(profile);
        
        console.log("[ANALYTICS_DEBUG] Analytics data set successfully");
        toast.success("Analytics loaded successfully");
      } else {
        // Legacy GET endpoint for connected profiles
        const params = new URLSearchParams();
        if (profile.type === "talent") {
          params.append("talentId", profile.id);
        } else if (profile.type === "connected") {
          params.append("profileId", profile.id);
        }
        
        if (platformFilter !== "ALL") {
          params.append("platform", platformFilter);
        }
        
        params.append("dateRange", dateRange);
        
        const endpoint = `/api/admin/analytics?${params.toString()}`;
        console.log("[ANALYTICS_DEBUG] Using GET endpoint:", endpoint);
        
        const response = await apiFetch(endpoint);
        
        console.log("[ANALYTICS_DEBUG] API Response received:", {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });
        
        const data = await response.json();
        
        console.log("[ANALYTICS_DEBUG] API Response data:", data);
        
        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 404) {
            const errorMsg = data?.error || "Profile not found";
            console.error("[ANALYTICS_DEBUG] Profile not found (404):", errorMsg);
            throw new Error(errorMsg);
          }
          const errorMsg = data?.details || data?.error || response.statusText || "Failed to fetch analytics";
          console.error("[ANALYTICS_DEBUG] API Error:", {
            errorMsg,
            status: response.status,
            fullError: data,
          });
          throw new Error(errorMsg);
        }
        
        setAnalyticsData(data);
        setDataFreshness(new Date());
        setSelectedProfile(profile);
        
        console.log("[ANALYTICS_DEBUG] Analytics data set successfully");
        toast.success("Analytics loaded successfully");
      }
    } catch (err) {
      console.error("[ANALYTICS_DEBUG] Error fetching analytics:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
      setError(err.message);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [platformFilter, dateRange]);

  /**
   * Fetch comparison data
   */
  const handleFetchComparison = useCallback(async (profile) => {
    try {
      setRefreshing(true);
      
      let body = {};
      
      // Build request body based on profile type
      if (profile.type === "talent") {
        body.talentId = profile.id;
      } else if (profile.type === "connected") {
        body.talentId = profile.id;
      } else if (profile.type === "external") {
        // External profile: send URL
        body.url = profile.url || `${profile.platform}/${profile.handle}`;
      }
      
      // Use POST /analyze endpoint
      if (profile.type === "external" || !profile.id) {
        const response = await apiFetch("/api/admin/analytics/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          const errorMsg = data?.details || data?.error || "Failed to fetch comparison data";
          throw new Error(errorMsg);
        }
        
        setComparisonData(data);
        setComparisonProfile(profile);
        
        toast.success("Comparison data loaded");
      } else {
        // Legacy GET endpoint for connected profiles
        const params = new URLSearchParams();
        if (profile.type === "talent") {
          params.append("talentId", profile.id);
        } else if (profile.type === "connected") {
          params.append("profileId", profile.id);
        }
        
        params.append("dateRange", dateRange);
        
        const response = await apiFetch(`/api/admin/analytics?${params.toString()}`);
        
        const data = await response.json();
        
        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 404) {
            const errorMsg = data?.error || "Profile not found";
            throw new Error(errorMsg);
          }
          const errorMsg = data?.details || data?.error || "Failed to fetch comparison data";
          throw new Error(errorMsg);
        }
        
        setComparisonData(data);
        setComparisonProfile(profile);
        
        toast.success("Comparison data loaded");
      }
    } catch (err) {
      console.error("Error fetching comparison:", err);
      toast.error("Failed to load comparison data");
    } finally {
      setRefreshing(false);
    }
  }, [dateRange]);

  /**
   * Manually refresh analytics data
   */
  const handleRefresh = useCallback(async () => {
    if (!selectedProfile) return;
    
    try {
      setRefreshing(true);
      await handleFetchAnalytics(selectedProfile);
      toast.success("Analytics refreshed");
    } catch (err) {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }, [selectedProfile, handleFetchAnalytics]);

  /**
   * Format time since last update
   */
  const getDataFreshnessText = () => {
    if (!dataFreshness) return "Never";
    
    const now = new Date();
    const diff = Math.floor((now - dataFreshness) / 1000); // seconds
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Cross-platform social intelligence"
      navLinks={ADMIN_NAV_LINKS}
    >
      {/* Header & Controls */}
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-brand-red" />
              <div>
                <h2 className="font-display text-3xl uppercase text-brand-black">Analytics</h2>
                <p className="mt-1 text-sm text-brand-black/60">
                  Analyse any social profile — represented or external
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {selectedProfile && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold transition ${
                    refreshing
                      ? "bg-brand-black/10 text-brand-black/60 cursor-not-allowed"
                      : "bg-brand-red text-white hover:bg-brand-red/90"
                  }`}
                  title={`Last updated: ${getDataFreshnessText()}`}
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                
                <button
                  className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-brand-black/5 transition"
                  disabled
                  title="Coming soon"
                >
                  <Download className="h-3 w-3" />
                  Export
                </button>
              </>
            )}
          </div>
        </div>

        {/* Data Freshness */}
        {dataFreshness && (
          <div className="mt-4 text-[0.7rem] uppercase tracking-[0.2em] text-brand-black/50">
            Data as of {getDataFreshnessText()}
          </div>
        )}
      </section>

      {/* Profile Selector */}
      <ProfileInputSelector 
        onProfileSelect={handleFetchAnalytics}
        disabled={loading}
      />

      {/* Global Controls */}
      {selectedProfile && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-black/60" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60">
                Filters
              </span>
            </div>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-full border border-brand-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-brand-black/20 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
            >
              <option value="ALL">All Platforms</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="YOUTUBE">YouTube</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-full border border-brand-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-brand-black/20 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Compare Mode Toggle */}
            <label className="flex items-center gap-2 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60">
                Compare Mode
              </span>
            </label>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-12 text-center">
          <div className="inline-block">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/10 border-t-brand-red"></div>
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-brand-black/60">
            Loading analytics...
          </p>
        </section>
      )}

      {/* Error State */}
      {error && !loading && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">⚠️</div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">Failed to load analytics</h3>
              <p className="mt-2 text-xs text-red-800">
                {error}
              </p>
              
              {/* Contextual help based on error type */}
              <div className="mt-3 text-xs text-red-700 space-y-1">
                {error.includes("private") && (
                  <>
                    <p className="font-semibold">ℹ️ Profile is private</p>
                    <p>Instagram requires API authentication for private profiles. We currently support public profiles only.</p>
                  </>
                )}
                {error.includes("not found") && (
                  <>
                    <p className="font-semibold">ℹ️ Profile not found</p>
                    <p>Check that the username is spelled correctly and that the profile exists on the selected platform.</p>
                  </>
                )}
                {error.includes("rate limit") && (
                  <>
                    <p className="font-semibold">ℹ️ Rate limit exceeded</p>
                    <p>Too many requests. Please wait a few minutes before trying again.</p>
                  </>
                )}
                {error.includes("timeout") && (
                  <>
                    <p className="font-semibold">ℹ️ Request timeout</p>
                    <p>The platform took too long to respond. Try again in a moment.</p>
                  </>
                )}
                {!error.includes("private") && !error.includes("not found") && !error.includes("rate limit") && !error.includes("timeout") && (
                  <>
                    <p className="font-semibold">ℹ️ Technical error</p>
                    <p>Check the browser console (F12) for detailed debug logs to help troubleshoot this issue.</p>
                  </>
                )}
              </div>
              
              {selectedProfile && (
                <button
                  onClick={handleRefresh}
                  className="mt-4 inline-block rounded-full border border-red-300 bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-200 transition"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!selectedProfile && !loading && (
        <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-12 text-center">
          <BarChart3 className="h-12 w-12 text-brand-black/30 mx-auto mb-4" />
          <p className="text-sm uppercase tracking-[0.2em] text-brand-black/60 mb-2">
            No Profile Selected
          </p>
          <p className="text-xs text-brand-black/50 max-w-md mx-auto">
            Search for a talent, select a connected profile, or paste a social URL to get started.
          </p>
        </section>
      )}

      {/* Analytics Modules */}
      {selectedProfile && analyticsData && !loading && (
        <>
          {/* Overview Intelligence */}
          <AnalyticsOverviewIntelligence 
            data={analyticsData}
            profile={selectedProfile}
          />

          {/* Content Performance */}
          <AnalyticsContentPerformance
            data={analyticsData}
            platformFilter={platformFilter}
          />

          {/* Audience & Community Health */}
          <AnalyticsAudienceHealth
            data={analyticsData}
          />

          {/* Keywords & Themes */}
          <AnalyticsKeywordsThemes
            data={analyticsData}
            comparisonData={compareMode ? comparisonData : null}
            comparisonProfile={compareMode ? comparisonProfile : null}
          />

          {/* Admin Notes */}
          <AdminNotesAnalytics
            profile={selectedProfile}
            comparisonProfile={compareMode ? comparisonProfile : null}
          />
        </>
      )}
    </DashboardShell>
  );
}

export default AdminAnalyticsPage;

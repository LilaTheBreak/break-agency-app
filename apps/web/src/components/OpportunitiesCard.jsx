import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";
import { isFeatureEnabled } from "../config/features.js";
import { ComingSoon } from "./ComingSoon.jsx";

/**
 * OpportunitiesCard - Summary card showing opportunities count and CTA
 * 
 * Uses existing APIs only:
 * - Creators: /api/opportunities/creator/all
 * - Brands/Admins: /api/opportunities
 * 
 * Respects feature flags:
 * - CREATOR_OPPORTUNITIES_ENABLED
 * - BRAND_OPPORTUNITIES_ENABLED
 * - EXCLUSIVE_OPPORTUNITIES_ENABLED
 */
export function OpportunitiesCard({ session, role }) {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine role and feature flag
  const userRole = role || session?.role || "CREATOR";
  const isCreator = userRole === "CREATOR" || userRole === "TALENT";
  const isBrand = userRole === "BRAND";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

  // Determine which feature flag to check
  const featureFlag = isCreator 
    ? "CREATOR_OPPORTUNITIES_ENABLED"
    : isBrand 
    ? "BRAND_OPPORTUNITIES_ENABLED"
    : "EXCLUSIVE_OPPORTUNITIES_ENABLED";

  // Determine API endpoint and route
  const apiEndpoint = isCreator 
    ? "/api/opportunities/creator/all"
    : "/api/opportunities";
  
  const ctaRoute = isCreator
    ? "/creator/opportunities"
    : isBrand
    ? "/brand/dashboard/opportunities"
    : "/admin/opportunities";

  // Check feature flag first
  if (!isFeatureEnabled(featureFlag)) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
            <h3 className="font-display text-2xl uppercase">Opportunities</h3>
          </div>
        </div>
        <div className="mt-4">
          <ComingSoon
            feature={featureFlag}
            title="Opportunities"
            description="Browse and apply to brand opportunities"
          />
        </div>
      </section>
    );
  }

  // Fetch opportunities
  useEffect(() => {
    let cancelled = false;

    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(apiEndpoint);
        
        if (!response.ok) {
          // Graceful degradation for expected errors - show empty state instead of error
          if (response.status === 404 || response.status === 403 || response.status === 503) {
            setOpportunities([]);
            setLoading(false);
            return;
          }
          // Only throw for unexpected errors (500, etc.)
          throw new Error(`Failed to fetch opportunities: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response shapes
        const opportunitiesList = isCreator
          ? (data.opportunities || [])
          : (Array.isArray(data) ? data : []);

        if (!cancelled) {
          setOpportunities(opportunitiesList);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching opportunities:", err);
          setError(err.message);
          setOpportunities([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOpportunities();

    return () => {
      cancelled = true;
    };
  }, [apiEndpoint, isCreator]);

  // Compute stats client-side
  const totalActive = opportunities.filter(opp => opp.isActive !== false).length;
  const appliedCount = isCreator 
    ? opportunities.filter(opp => opp.applicationStatus).length
    : null;
  const liveCount = !isCreator
    ? opportunities.filter(opp => opp.isActive === true).length
    : null;

  // Handle loading state
  if (loading) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
            <h3 className="font-display text-2xl uppercase">Opportunities</h3>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/20 border-t-brand-black"></div>
        </div>
      </section>
    );
  }

  // Handle error state (graceful degradation)
  if (error) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
            <h3 className="font-display text-2xl uppercase">Opportunities</h3>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-6 text-center">
          <p className="text-sm text-brand-black/60">Unable to load opportunities</p>
          <p className="mt-2 text-xs text-brand-black/40">This feature is currently unavailable</p>
        </div>
      </section>
    );
  }

  // Handle empty state
  if (totalActive === 0) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
            <h3 className="font-display text-2xl uppercase">Opportunities</h3>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-6 text-center">
          <p className="text-sm text-brand-black/60">No opportunities yet</p>
          <p className="mt-2 text-xs text-brand-black/40">
            {isCreator 
              ? "Brand opportunities will appear here once campaigns are live"
              : "Create your first opportunity to find creators"}
          </p>
          <button
            onClick={() => navigate(ctaRoute)}
            className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5 transition-colors"
          >
            View opportunities
          </button>
        </div>
      </section>
    );
  }

  // Render card with data
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
          <h3 className="font-display text-2xl uppercase">Opportunities</h3>
        </div>
      </div>
      
      <div className="mt-4 space-y-3">
        {/* Primary stat */}
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Active opportunities</p>
          <p className="mt-2 font-display text-3xl uppercase text-brand-black">{totalActive}</p>
        </div>

        {/* Secondary info */}
        {(appliedCount !== null || liveCount !== null) && (
          <div className="flex flex-wrap gap-3 text-sm text-brand-black/70">
            {isCreator && appliedCount !== null && (
              <span className="text-xs uppercase tracking-[0.3em]">
                {appliedCount} applied
              </span>
            )}
            {!isCreator && liveCount !== null && (
              <span className="text-xs uppercase tracking-[0.3em]">
                {liveCount} live
              </span>
            )}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={() => navigate(ctaRoute)}
          className="w-full rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black/5 transition-colors"
        >
          View opportunities
        </button>
      </div>
    </section>
  );
}


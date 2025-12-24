import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";

/**
 * Goals Progress Summary Component
 * 
 * Displays creator's goal progress across categories:
 * - Revenue goals
 * - Content goals
 * - Growth goals
 * - Campaign goals
 * 
 * Design: Motivational, not pressure-inducing
 * Permissions: View-only for talent, editable by admins elsewhere
 */

function ProgressBar({ percentage, label }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-[0.3em] text-brand-black/70">{label}</span>
        <span className="font-semibold text-brand-black">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-black/10">
        <div 
          className="h-full rounded-full bg-brand-black transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function GoalsProgressSummary({ session, basePath = "/exclusive" }) {
  const [goalsData, setGoalsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await apiFetch("/api/goals/progress");
        
        if (response.status === 404 || response.status === 403) {
          // Endpoint not implemented or no access
          setGoalsData(null);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setGoalsData(data);
        } else {
          // Error - show empty state
          setGoalsData(null);
        }
      } catch (error) {
        console.warn("[GoalsProgressSummary] Failed to load:", error);
        setGoalsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [session]);

  // Loading state
  if (loading) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Goals progress
        </p>
        <p className="mt-4 text-sm text-brand-black/60">Loading your goals...</p>
      </section>
    );
  }

  // Empty state - No goals set
  if (!goalsData || !goalsData.hasGoals) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Goals progress
        </p>
        <h3 className="mt-2 font-display text-2xl uppercase text-brand-black">
          Goals help us plan the work
        </h3>
        <p className="mt-3 text-sm text-brand-black/70">
          Not pressure the outcome. Set clear targets so we can structure campaigns, content, and partnerships around what matters to you.
        </p>
        <Link
          to={`${basePath}/goals`}
          className="mt-4 inline-flex rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90 transition-colors"
        >
          Set your goals
        </Link>
      </section>
    );
  }

  // Calculate overall progress
  const categories = goalsData.categories || [];
  const overallProgress = goalsData.overallProgress || 0;
  const showBreakdown = categories.length > 0;

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Goals progress
          </p>
          <h3 className="mt-1 font-display text-2xl uppercase text-brand-black">
            Your goals
          </h3>
        </div>
        <Link
          to={`${basePath}/goals`}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition-colors"
        >
          Update
        </Link>
      </div>

      {/* Overall progress */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black">
            Overall progress
          </p>
          <p className="font-display text-3xl uppercase text-brand-black">
            {overallProgress}%
          </p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-brand-black/10">
          <div 
            className="h-full rounded-full bg-brand-black transition-all duration-500"
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Category breakdown */}
      {showBreakdown && (
        <div className="mt-6 space-y-4">
          {categories.map((category, idx) => (
            <ProgressBar 
              key={idx}
              percentage={category.percentage || 0}
              label={category.label || category.name}
            />
          ))}
        </div>
      )}

      {/* Motivational message */}
      <div className="mt-6 rounded-2xl bg-brand-linen/40 p-4">
        <p className="text-sm text-brand-black/80">
          {overallProgress >= 75 
            ? "You're crushing it. Keep the momentum going." 
            : overallProgress >= 50
            ? "Solid progress. The work is happening."
            : overallProgress >= 25
            ? "Early days — stay consistent and trust the process."
            : "Starting strong. Every step forward counts."}
        </p>
      </div>
    </section>
  );
}

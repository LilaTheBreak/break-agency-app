import React from "react";

/**
 * SkeletonLoader - Contextual loading states for dashboards
 * Purpose: Replace generic spinners with content-aware skeletons
 * Design: Matches actual content structure for smooth perceived performance
 */

// Base skeleton animation
const shimmer = "animate-pulse bg-gradient-to-r from-brand-black/5 via-brand-black/10 to-brand-black/5";

// Card skeleton - for metric cards, campaign cards
export function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-brand-black/10 bg-brand-white p-6 ${className}`}>
      <div className={`h-4 w-24 rounded ${shimmer}`} />
      <div className={`mt-3 h-8 w-32 rounded ${shimmer}`} />
      <div className={`mt-2 h-3 w-40 rounded ${shimmer}`} />
    </div>
  );
}

// Metric row skeleton - for dashboard stats
export function SkeletonMetrics({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 border-b border-brand-black/10 py-4">
      <div className={`h-10 w-10 rounded-full ${shimmer}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-48 rounded ${shimmer}`} />
        <div className={`h-3 w-32 rounded ${shimmer}`} />
      </div>
      <div className={`h-4 w-20 rounded ${shimmer}`} />
    </div>
  );
}

// Table skeleton
export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6">
      <div className={`mb-6 h-6 w-48 rounded ${shimmer}`} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
}

// Section skeleton - for dashboard sections
export function SkeletonSection({ title = true, rows = 3 }) {
  return (
    <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      {title && (
        <div className="mb-6 space-y-2">
          <div className={`h-3 w-24 rounded ${shimmer}`} />
          <div className={`h-7 w-64 rounded ${shimmer}`} />
        </div>
      )}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <div className={`h-4 w-full rounded ${shimmer}`} />
            <div className={`mt-2 h-4 w-3/4 rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Campaign card skeleton
export function SkeletonCampaign() {
  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className={`h-3 w-32 rounded ${shimmer}`} />
          <div className={`h-6 w-48 rounded ${shimmer}`} />
        </div>
        <div className={`h-8 w-24 rounded-full ${shimmer}`} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3">
            <div className={`h-3 w-20 rounded ${shimmer}`} />
            <div className={`mt-2 h-5 w-16 rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// List skeleton - for inbox, notifications
export function SkeletonList({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          <div className="flex items-start gap-3">
            <div className={`h-12 w-12 rounded-full ${shimmer}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 rounded ${shimmer}`} />
              <div className={`h-3 w-1/2 rounded ${shimmer}`} />
              <div className={`h-3 w-full rounded ${shimmer}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard skeleton - full dashboard loading state
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header metrics */}
      <SkeletonMetrics count={4} />
      
      {/* Main sections */}
      <SkeletonSection rows={2} />
      <SkeletonSection rows={3} />
      
      {/* Campaign/content cards */}
      <div className="space-y-4">
        <SkeletonCampaign />
        <SkeletonCampaign />
      </div>
    </div>
  );
}

// Contextual loading message with skeleton
export function SkeletonWithMessage({ message, children }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4 flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-brand-red" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <p className="text-sm text-brand-black/70">{message}</p>
      </div>
      {children}
    </div>
  );
}

export default {
  Card: SkeletonCard,
  Metrics: SkeletonMetrics,
  Table: SkeletonTable,
  TableRow: SkeletonTableRow,
  Section: SkeletonSection,
  Campaign: SkeletonCampaign,
  List: SkeletonList,
  Dashboard: SkeletonDashboard,
  WithMessage: SkeletonWithMessage,
};

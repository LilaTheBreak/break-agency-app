import React from "react";
import { TrendingUp, DollarSign, CheckSquare, BarChart3 } from "lucide-react";

/**
 * HealthSnapshotCards Component
 * 
 * Displays 4 key metrics in a scannable grid:
 * - Pipeline (active deals)
 * - Earnings (total revenue)
 * - Tasks (pending actions)
 * - Health Score (overall status)
 * 
 * This is the "Health" layer of the 3-tier architecture:
 * Identity → Health → Workspaces
 */
export function HealthSnapshotCards({ talent, stats = {} }) {
  if (!talent) return null;

  // Calculate pipeline status
  const activeDeals = talent.deals?.filter((d) => d.status !== "CLOSED" && d.status !== "LOST") || [];
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const dealCount = activeDeals.length;

  // Calculate earnings
  const totalEarnings = talent.revenue?.total || 0;
  const totalPayouts = talent.revenue?.payouts || 0;
  const netEarnings = totalEarnings - totalPayouts;

  // Calculate pending tasks
  const pendingTasks = talent.tasks?.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED") || [];
  const taskCount = pendingTasks.length;

  // Calculate health score (0-100)
  // Based on: active deals (30%), earnings (30%), no pending tasks (20%), profile completeness (20%)
  const profileCompleteness = [
    talent.legalName,
    talent.primaryEmail,
    talent.socialAccounts?.length > 0,
    talent.linkedUser?.id,
  ].filter(Boolean).length / 4;

  const healthScore = Math.round(
    Math.min(100,
      (dealCount > 0 ? 30 : 0) +
      (totalEarnings > 0 ? 30 : 0) +
      (pendingTasks.length < 5 ? 20 : pendingTasks.length < 10 ? 10 : 0) +
      profileCompleteness * 20
    )
  );

  // Determine health color
  const getHealthColor = (score) => {
    if (score >= 80) return { bg: "bg-green-100", text: "text-green-700", icon: "text-green-600" };
    if (score >= 60) return { bg: "bg-yellow-100", text: "text-yellow-700", icon: "text-yellow-600" };
    return { bg: "bg-red-100", text: "text-red-700", icon: "text-red-600" };
  };

  const healthColor = getHealthColor(healthScore);

  const cards = [
    {
      label: "Active Pipeline",
      value: dealCount,
      subtext: `$${(pipelineValue / 1000).toFixed(0)}k value`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "Total Earnings",
      value: `$${(totalEarnings / 1000).toFixed(0)}k`,
      subtext: `${netEarnings > 0 ? "+" : ""}$${(netEarnings / 1000).toFixed(0)}k net`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Pending Tasks",
      value: taskCount,
      subtext: taskCount === 0 ? "All caught up!" : "Tasks awaiting action",
      icon: CheckSquare,
      color: `${taskCount === 0 ? "text-green-600" : "text-amber-600"}`,
    },
    {
      label: "Health Score",
      value: `${healthScore}%`,
      subtext: "Profile & performance",
      icon: BarChart3,
      color: healthColor.icon,
      bgColor: healthColor.bg,
    },
  ];

  return (
    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const bgClass = card.bgColor || "bg-brand-linen/50";
        return (
          <div
            key={idx}
            className={`rounded-2xl border border-brand-black/10 ${bgClass} p-4 transition-all duration-300 hover:shadow-md hover:border-brand-black/20 hover:scale-105`}
            style={{
              animationDelay: `${idx * 50}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards',
              opacity: 0,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{card.label}</p>
              <Icon className={`h-4 w-4 ${card.color} transition-transform duration-300`} />
            </div>
            <p className="font-display text-2xl uppercase text-brand-black">{card.value}</p>
            {card.subtext && (
              <p className="mt-2 text-xs text-brand-black/50">{card.subtext}</p>
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

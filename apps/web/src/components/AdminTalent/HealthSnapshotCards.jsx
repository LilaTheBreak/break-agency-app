import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, CheckSquare, BarChart3 } from "lucide-react";
import { calculateHealthScore, getScoreColor } from "../../utils/healthScore.js";
import { HealthBreakdownModal } from "../HealthBreakdownModal.jsx";

// Local currency formatter for GBP formatting
const formatCompactCurrency = (amount, currency = "GBP") => {
  if (!amount || amount === 0) return `${currency === "GBP" ? "£" : "$"}0`;
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "£";
  if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`;
  return `${symbol}${amount.toFixed(0)}`;
};

/**
 * HealthSnapshotCards Component
 * 
 * Displays 4 key metrics in a scannable grid:
 * - Pipeline (active deals) → Deals Tab
 * - Earnings (total revenue) → Revenue Tab
 * - Tasks (pending actions) → Tasks Tab
 * - Health Score (overall status) → Health Breakdown Modal
 * 
 * All cards are clickable and navigate to the relevant section.
 * Health Score opens an interactive breakdown modal showing what's affecting the score.
 * 
 * This is the "Health" layer of the 3-tier architecture:
 * Identity → Health → Workspaces
 */
export function HealthSnapshotCards({ talent, stats = {}, talentId }) {
  const navigate = useNavigate();
  const [showHealthModal, setShowHealthModal] = useState(false);
  
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

  // Calculate health score using the new system
  const { score: healthScore, issues: healthIssues, summary: healthSummary } = calculateHealthScore(talent);

  // Determine health color using the score color system
  const healthBgColor = getScoreColor(healthScore);

  // Click handlers for navigation
  const handlePipelineClick = () => {
    navigate(`/admin/talent/${talentId || talent.id}`, { state: { tab: "deals" } });
  };

  const handleEarningsClick = () => {
    navigate(`/admin/talent/${talentId || talent.id}`, { state: { tab: "revenue" } });
  };

  const handleTasksClick = () => {
    navigate(`/admin/talent/${talentId || talent.id}`, { state: { tab: "tasks" } });
  };

  const handleHealthClick = () => {
    setShowHealthModal(true);
  };

  const cards = [
    {
      label: "Active Pipeline",
      value: dealCount,
      subtext: dealCount === 0 ? "No active deals" : formatCompactCurrency(pipelineValue, talent.currency || "GBP"),
      icon: TrendingUp,
      color: "text-blue-600",
      onClick: handlePipelineClick,
      action: "View deals →",
    },
    {
      label: "Total Earnings",
      value: formatCompactCurrency(totalEarnings, talent.currency || "GBP"),
      subtext: netEarnings > 0 
        ? `${formatCompactCurrency(netEarnings, talent.currency || "GBP")} net`
        : "No earnings yet",
      icon: DollarSign,
      color: "text-green-600",
      onClick: handleEarningsClick,
      action: "View revenue →",
    },
    {
      label: "Pending Tasks",
      value: taskCount,
      subtext: taskCount === 0 ? "All caught up!" : "Tasks awaiting action",
      icon: CheckSquare,
      color: `${taskCount === 0 ? "text-green-600" : "text-amber-600"}`,
      onClick: handleTasksClick,
      action: taskCount === 0 ? "Refresh →" : "View tasks →",
    },
    {
      label: "Health Score",
      value: `${healthScore}%`,
      subtext: healthSummary,
      icon: BarChart3,
      color: "text-white",
      bgColor: `text-white`,
      onClick: handleHealthClick,
      action: healthIssues.length > 0 ? `${healthIssues.length} issue${healthIssues.length !== 1 ? 's' : ''} →` : "View details →",
      healthScore: healthScore,
    },
  ];

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isHealthCard = card.label === "Health Score";
          
          return (
            <button
              key={idx}
              onClick={card.onClick}
              className={`${isHealthCard ? '' : 'card'} p-4 transition-elevation cursor-pointer text-left rounded-2xl border transition-all ${
                isHealthCard 
                  ? 'border-none text-white shadow-lg hover:shadow-xl' 
                  : 'border-brand-black/10 bg-white hover:bg-brand-black/2'
              }`}
              style={{
                animationDelay: `${idx * 50}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0,
                ...(isHealthCard && { backgroundColor: healthBgColor })
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className={`text-xs uppercase tracking-[0.3em] ${isHealthCard ? 'opacity-90' : 'text-brand-black/60'}`}>
                  {card.label}
                </p>
                <Icon className={`h-4 w-4 ${isHealthCard ? 'opacity-80' : card.color} transition-transform duration-300 hover:scale-110`} />
              </div>
              <p className={`font-display text-2xl uppercase ${isHealthCard ? 'text-white' : 'text-brand-black'}`}>
                {card.value}
              </p>
              {card.subtext && (
                <p className={`mt-2 text-xs ${isHealthCard ? 'opacity-80' : 'text-brand-black/50'}`}>
                  {card.subtext}
                </p>
              )}
              {card.action && (
                <p className={`mt-3 text-xs font-medium transition-colors ${
                  isHealthCard 
                    ? 'opacity-90 hover:opacity-100' 
                    : 'text-brand-black/70 hover:text-brand-black'
                }`}>
                  {card.action}
                </p>
              )}
            </button>
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

      {/* Health Breakdown Modal */}
      <HealthBreakdownModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        talent={talent}
        onCreateTask={(taskData) => {
          // Will implement task creation
          console.log("Create task from health issue:", taskData);
        }}
        onAddSocial={(platforms) => {
          // Will implement social addition
          console.log("Add social profiles:", platforms);
        }}
        onCreateDeal={() => {
          // Navigate to deals tab and open modal
          navigate(`/admin/talent/${talentId || talent.id}`, { state: { tab: "deals" } });
          setShowHealthModal(false);
        }}
      />
    </>
  );
}

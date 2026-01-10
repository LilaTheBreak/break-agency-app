import React, { useMemo } from "react";
import { getStageOrder } from "./DealStatusBadge.jsx";

/**
 * DealPipelineChart Component
 * 
 * Visual pipeline indicator showing deal distribution across stages.
 * Displays count and total value for each stage.
 */
export function DealPipelineChart({ deals = [] }) {
  const pipelineData = useMemo(() => {
    const stages = [
      { key: null, label: "Leads" },
      { key: "NEW_LEAD", label: "Discussion" },
      { key: "NEGOTIATION", label: "Negotiating" },
      { key: "CONTRACT_SENT", label: "Contract" },
      { key: "CONTRACT_SIGNED", label: "Signed" },
      { key: "DELIVERABLES_IN_PROGRESS", label: "In Progress" },
      { key: "PAYMENT_PENDING", label: "Pending" },
      { key: "COMPLETED", label: "Won" },
    ];

    const data = stages.map((stage) => {
      const stageDeal = deals.filter((d) => (d.stage || null) === stage.key);
      return {
        ...stage,
        count: stageDeal.length,
        value: stageDeal.reduce((sum, d) => sum + (d.value || 0), 0),
        deals: stageDeal,
      };
    });

    return data.filter((d) => d.count > 0);
  }, [deals]);

  const totalValue = useMemo(() => {
    return deals.reduce((sum, d) => sum + (d.value || 0), 0);
  }, [deals]);

  const stageColors = {
    null: "bg-gray-200",
    NEW_LEAD: "bg-blue-200",
    NEGOTIATION: "bg-purple-200",
    CONTRACT_SENT: "bg-orange-200",
    CONTRACT_SIGNED: "bg-yellow-200",
    DELIVERABLES_IN_PROGRESS: "bg-cyan-200",
    PAYMENT_PENDING: "bg-amber-200",
    COMPLETED: "bg-green-200",
  };

  if (pipelineData.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-6 text-center">
        <p className="text-sm text-brand-black/60">No deals in pipeline</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6 transition-all duration-300 hover:shadow-md hover:border-brand-black/20">
      {/* Title */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">Pipeline Distribution</p>
        <h3 className="font-display text-2xl uppercase text-brand-black">
          £{(totalValue / 1000).toFixed(0)}k
        </h3>
        <p className="text-xs text-brand-black/50 mt-1">across {deals.length} deals</p>
      </div>

      {/* Pipeline bars */}
      <div className="space-y-3">
        {pipelineData.map((stage, idx) => {
          const percentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0;
          const bgColor = stageColors[stage.key] || "bg-gray-200";

          return (
            <div key={stage.key ?? "leads"} style={{ animationDelay: `${idx * 50}ms`, animation: 'fadeInLeft 0.6s ease-out forwards', opacity: 0 }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-brand-black uppercase tracking-[0.1em]">
                  {stage.label}
                </p>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-xs text-brand-black/60">{stage.count}</span>
                  <span className="text-xs font-semibold text-brand-black">
                    £{(stage.value / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-brand-black/5 overflow-hidden">
                <div
                  className={`h-full ${bgColor} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-brand-black/10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-1">Avg Deal Value</p>
          <p className="font-semibold text-brand-black">
            £{deals.length > 0 ? ((totalValue / deals.length) / 1000).toFixed(1) : 0}k
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-1">Total Deals</p>
          <p className="font-semibold text-brand-black">{deals.length}</p>
        </div>
      </div>
      <style>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

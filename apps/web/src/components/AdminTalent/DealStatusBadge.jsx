import React from "react";
import { CheckCircle, Clock, AlertCircle, Zap, TrendingUp } from "lucide-react";

/**
 * DealStatusBadge Component
 * 
 * Visual status indicator for deal pipeline stages.
 * Color-coded and icon-based for quick visual recognition.
 */
export function DealStatusBadge({ status, stage }) {
  // Map stage to visual properties
  const stageConfig = {
    // Opportunities (no stage)
    null: {
      label: "Lead",
      color: "bg-gray-100 text-gray-700",
      icon: TrendingUp,
      lightBg: "bg-gray-50",
    },
    // Deal stages
    NEW_LEAD: {
      label: "In Discussion",
      color: "bg-blue-100 text-blue-700",
      icon: Clock,
      lightBg: "bg-blue-50",
    },
    NEGOTIATION: {
      label: "Negotiation",
      color: "bg-purple-100 text-purple-700",
      icon: AlertCircle,
      lightBg: "bg-purple-50",
    },
    CONTRACT_SENT: {
      label: "Awaiting Contract",
      color: "bg-orange-100 text-orange-700",
      icon: Clock,
      lightBg: "bg-orange-50",
    },
    CONTRACT_SIGNED: {
      label: "Contract Signed",
      color: "bg-yellow-100 text-yellow-700",
      icon: CheckCircle,
      lightBg: "bg-yellow-50",
    },
    DELIVERABLES_IN_PROGRESS: {
      label: "In Progress",
      color: "bg-cyan-100 text-cyan-700",
      icon: Zap,
      lightBg: "bg-cyan-50",
    },
    PAYMENT_PENDING: {
      label: "Payment Pending",
      color: "bg-amber-100 text-amber-700",
      icon: Clock,
      lightBg: "bg-amber-50",
    },
    PAYMENT_RECEIVED: {
      label: "Completed",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle,
      lightBg: "bg-green-50",
    },
    COMPLETED: {
      label: "Completed",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle,
      lightBg: "bg-green-50",
    },
    LOST: {
      label: "Declined",
      color: "bg-red-100 text-red-700",
      icon: AlertCircle,
      lightBg: "bg-red-50",
    },
  };

  const config = stageConfig[stage || status] || stageConfig.null;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.color} text-xs font-semibold`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}

/**
 * Helper to get stage color for background elements
 */
export function getStageColor(stage) {
  const colors = {
    null: "bg-gray-50",
    NEW_LEAD: "bg-blue-50",
    NEGOTIATION: "bg-purple-50",
    CONTRACT_SENT: "bg-orange-50",
    CONTRACT_SIGNED: "bg-yellow-50",
    DELIVERABLES_IN_PROGRESS: "bg-cyan-50",
    PAYMENT_PENDING: "bg-amber-50",
    PAYMENT_RECEIVED: "bg-green-50",
    COMPLETED: "bg-green-50",
    LOST: "bg-red-50",
  };
  return colors[stage] || colors.null;
}

/**
 * Helper to get stage order for sorting
 */
export function getStageOrder(stage) {
  const order = {
    null: 0,
    NEW_LEAD: 1,
    NEGOTIATION: 2,
    CONTRACT_SENT: 3,
    CONTRACT_SIGNED: 4,
    DELIVERABLES_IN_PROGRESS: 5,
    PAYMENT_PENDING: 6,
    PAYMENT_RECEIVED: 7,
    COMPLETED: 7,
    LOST: 8,
  };
  return order[stage] ?? 0;
}

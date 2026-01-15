/**
 * useEmailClassifier Hook
 * 
 * React hook to classify emails and manage routing instructions
 */

import { useState } from "react";
import { classifyEmail, extractEmailData } from "../services/emailClassifier.js";
import { routeEmail } from "../services/emailRoutingRules.js";

export function useEmailClassifier() {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState(null);

  /**
   * Classify a single email
   */
  const classify = async (email) => {
    setIsClassifying(true);
    setClassificationError(null);

    try {
      // Classify email
      const classification = classifyEmail(email);

      // Extract structured data
      const extractedData = extractEmailData(email, classification);

      // Get routing instructions
      const instructions = await routeEmail(email, classification, extractedData);

      return {
        classification,
        extractedData,
        instructions,
        success: true
      };
    } catch (error) {
      const errorMessage = error.message || "Failed to classify email";
      setClassificationError(errorMessage);

      return {
        classification: null,
        extractedData: null,
        instructions: null,
        success: false,
        error: errorMessage
      };
    } finally {
      setIsClassifying(false);
    }
  };

  /**
   * Classify multiple emails (batch)
   */
  const classifyBatch = async (emails) => {
    setIsClassifying(true);
    setClassificationError(null);

    try {
      const results = await Promise.all(
        emails.map(email => classify(email).catch(err => ({
          success: false,
          error: err.message
        })))
      );

      return {
        results,
        total: emails.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    } catch (error) {
      const errorMessage = error.message || "Batch classification failed";
      setClassificationError(errorMessage);

      return {
        results: [],
        total: emails.length,
        successful: 0,
        failed: emails.length,
        error: errorMessage
      };
    } finally {
      setIsClassifying(false);
    }
  };

  /**
   * Get classification badge details
   */
  const getBadgeDetails = (classificationType) => {
    const details = {
      MEETING_REQUEST: {
        label: "Meeting",
        color: "bg-blue-100 text-blue-800",
        icon: "Calendar",
        priority: "HIGH"
      },
      EVENT_INVITE: {
        label: "Event",
        color: "bg-purple-100 text-purple-800",
        icon: "Star",
        priority: "HIGH"
      },
      BRAND_OPPORTUNITY: {
        label: "Brand",
        color: "bg-emerald-100 text-emerald-800",
        icon: "Building2",
        priority: "MEDIUM"
      },
      DEAL_NEGOTIATION: {
        label: "Deal",
        color: "bg-orange-100 text-orange-800",
        icon: "TrendingUp",
        priority: "HIGH"
      },
      INVOICE_PAYMENT: {
        label: "Invoice",
        color: "bg-red-100 text-red-800",
        icon: "FileText",
        priority: "MEDIUM"
      },
      DELIVERABLE_CONTENT: {
        label: "Deliverable",
        color: "bg-cyan-100 text-cyan-800",
        icon: "Package",
        priority: "HIGH"
      },
      TASK_ACTION: {
        label: "Action",
        color: "bg-amber-100 text-amber-800",
        icon: "CheckSquare",
        priority: "MEDIUM"
      },
      SYSTEM_NOTIFICATION: {
        label: "System",
        color: "bg-gray-100 text-gray-800",
        icon: "Bell",
        priority: "LOW"
      },
      LOW_PRIORITY: {
        label: "Review",
        color: "bg-gray-100 text-gray-600",
        icon: "Help",
        priority: "LOW"
      }
    };

    return details[classificationType] || details.LOW_PRIORITY;
  };

  /**
   * Get action items from instructions
   */
  const getActionItems = (instructions) => {
    if (!instructions) return [];

    return [
      ...(instructions.actions || []),
      ...(instructions.requiresApproval || [])
    ];
  };

  return {
    classify,
    classifyBatch,
    getBadgeDetails,
    getActionItems,
    isClassifying,
    error: classificationError,
    clearError: () => setClassificationError(null)
  };
}

/**
 * Classification Badge Component
 */
export function ClassificationBadge({
  type,
  confidence,
  reason,
  compact = false
}) {
  const badgeDetails = {
    MEETING_REQUEST: {
      label: "Meeting",
      color: "bg-blue-100 text-blue-800",
      icon: "Calendar",
      priority: "HIGH"
    },
    EVENT_INVITE: {
      label: "Event",
      color: "bg-purple-100 text-purple-800",
      icon: "Star",
      priority: "HIGH"
    },
    BRAND_OPPORTUNITY: {
      label: "Brand",
      color: "bg-emerald-100 text-emerald-800",
      icon: "Building2",
      priority: "MEDIUM"
    },
    DEAL_NEGOTIATION: {
      label: "Deal",
      color: "bg-orange-100 text-orange-800",
      icon: "TrendingUp",
      priority: "HIGH"
    },
    INVOICE_PAYMENT: {
      label: "Invoice",
      color: "bg-red-100 text-red-800",
      icon: "FileText",
      priority: "MEDIUM"
    },
    DELIVERABLE_CONTENT: {
      label: "Deliverable",
      color: "bg-cyan-100 text-cyan-800",
      icon: "Package",
      priority: "HIGH"
    },
    TASK_ACTION: {
      label: "Action",
      color: "bg-amber-100 text-amber-800",
      icon: "CheckSquare",
      priority: "MEDIUM"
    },
    SYSTEM_NOTIFICATION: {
      label: "System",
      color: "bg-gray-100 text-gray-800",
      icon: "Bell",
      priority: "LOW"
    },
    LOW_PRIORITY: {
      label: "Review",
      color: "bg-gray-100 text-gray-600",
      icon: "Help",
      priority: "LOW"
    }
  };
  
  const details = badgeDetails[type] || badgeDetails.LOW_PRIORITY;

  if (compact) {
    return (
      <div className={`px-2 py-1 rounded text-xs font-medium ${details.color}`}>
        {details.label}
      </div>
    );
  }

  return (
    <div className={`px-3 py-2 rounded-lg ${details.color} flex items-start gap-2`}>
      <div className="flex-1">
        <div className="font-semibold text-sm">{details.label}</div>
        {reason && (
          <div className="text-xs opacity-75 mt-0.5">{reason}</div>
        )}
        {confidence && (
          <div className="text-xs opacity-60 mt-1">
            Confidence: {(confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Classification Alert Component (for uncertain classifications)
 */
export function UncertainClassificationAlert({
  classification,
  onReview,
  onCorrect
}) {
  const { primary } = classification;
  const isUncertain = primary.confidence < 0.7;

  if (!isUncertain) return null;

  return (
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="font-medium text-sm text-amber-900">
            Uncertain Classification
          </div>
          <div className="text-xs text-amber-700 mt-1">
            This email was classified as "{primary.type.replace(/_/g, " ")}" 
            with {(primary.confidence * 100).toFixed(0)}% confidence.
            Please review or correct this classification.
          </div>
        </div>
        <div className="flex gap-2">
          {onReview && (
            <button
              onClick={onReview}
              className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              Review
            </button>
          )}
          {onCorrect && (
            <button
              onClick={onCorrect}
              className="text-xs px-2 py-1 rounded bg-white text-amber-800 border border-amber-300 hover:bg-amber-50 transition-colors"
            >
              Correct
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

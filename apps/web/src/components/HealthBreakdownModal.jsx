import React, { useState } from "react";
import { calculateHealthScore, getScoreColor, getCategoryColor } from "../utils/healthScore";

/**
 * HealthBreakdownModal - Shows detailed health score breakdown with actionable issues
 * 
 * Props:
 * - isOpen: bool - Whether modal is open
 * - onClose: () => void - Called to close modal
 * - talent: Object - Talent object for health calculation
 * - onCreateTask: (taskData) => void - Called when user creates task from issue
 * - onAddSocial: (platforms) => void - Called when user wants to add socials
 * - onCreateDeal: () => void - Called when user wants to create deal
 */
export function HealthBreakdownModal({
  isOpen,
  onClose,
  talent,
  onCreateTask,
  onAddSocial,
  onCreateDeal
}) {
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [creatingTaskFor, setCreatingTaskFor] = useState(null);

  if (!isOpen || !talent) return null;

  const { score, issues, summary } = calculateHealthScore(talent);

  // Group issues by category
  const issuesByCategory = {};
  issues.forEach(issue => {
    if (!issuesByCategory[issue.category]) {
      issuesByCategory[issue.category] = [];
    }
    issuesByCategory[issue.category].push(issue);
  });

  const handleActionClick = (issue) => {
    switch (issue.actionType) {
      case "view_tasks":
        // Could scroll to tasks section or open tasks tab
        setCreatingTaskFor(issue.id);
        break;
      case "create_deal":
        onCreateDeal?.();
        onClose();
        break;
      case "add_social":
        onAddSocial?.(issue.actionData.platforms);
        break;
      case "complete_profile":
        // Could navigate to profile section
        break;
      case "review_briefs":
        // Could navigate to briefs
        break;
      case "create_task":
        setCreatingTaskFor(issue.id);
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-brand-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-brand-black/10 px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-brand-black">Profile Health Breakdown</h2>
              <p className="text-sm text-brand-black/60 mt-1">{talent.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-brand-black/50 hover:text-brand-black hover:bg-brand-black/5 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Score Summary */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ backgroundColor: getScoreColor(score) }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-90">Overall Score</p>
                <p className="text-5xl font-bold mt-2">{score}%</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{summary}</p>
                <p className="text-sm opacity-90 mt-2">
                  {issues.length === 0
                    ? "No action needed right now"
                    : `${issues.length} area${issues.length !== 1 ? 's' : ''} to improve`}
                </p>
              </div>
            </div>
          </div>

          {/* Issues by Category */}
          {issues.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(issuesByCategory).map(([category, categoryIssues]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div
                    className="flex items-center gap-2 mb-3 pb-2 border-b-2"
                    style={{ borderColor: getCategoryColor(category) + "40" }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <h3 className="text-sm font-semibold text-brand-black">{category}</h3>
                    <span className="text-xs text-brand-black/50 ml-auto">
                      {categoryIssues.length} {categoryIssues.length === 1 ? "issue" : "issues"}
                    </span>
                  </div>

                  {/* Issues */}
                  <div className="space-y-3 ml-5">
                    {categoryIssues.map(issue => (
                      <div
                        key={issue.id}
                        className={`rounded-xl border transition-all ${
                          expandedIssue === issue.id
                            ? "border-brand-black/20 bg-brand-black/5"
                            : "border-brand-black/10 bg-brand-white hover:bg-brand-black/2"
                        }`}
                      >
                        {/* Issue Header */}
                        <button
                          onClick={() =>
                            setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                          }
                          className="w-full text-left p-4 flex items-start gap-3 hover:bg-brand-black/5 rounded-xl transition-colors"
                        >
                          {/* Icon based on severity */}
                          <div className="flex-shrink-0 mt-1">
                            {issue.severity === "critical" && (
                              <span className="text-lg">🔴</span>
                            )}
                            {issue.severity === "high" && (
                              <span className="text-lg">⚠️</span>
                            )}
                            {issue.severity === "medium" && (
                              <span className="text-lg">ℹ️</span>
                            )}
                            {issue.severity === "low" && (
                              <span className="text-lg">💡</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-brand-black text-sm">{issue.title}</p>
                            <p className="text-xs text-brand-black/60 mt-1 line-clamp-1">
                              {issue.description}
                            </p>
                          </div>

                          {/* Impact Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className="inline-block px-2 py-1 rounded text-xs font-semibold text-white"
                              style={{
                                backgroundColor: issue.impact < -15 ? "#ef4444" : 
                                               issue.impact < -10 ? "#f97316" : 
                                               issue.impact < -5 ? "#f59e0b" : 
                                               "#6b7280"
                              }}
                            >
                              {issue.impact}%
                            </span>
                          </div>

                          {/* Expand Icon */}
                          <div className="flex-shrink-0 text-brand-black/40">
                            <span
                              className={`transition-transform ${
                                expandedIssue === issue.id ? "rotate-180" : ""
                              }`}
                            >
                              ▼
                            </span>
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {expandedIssue === issue.id && (
                          <div className="border-t border-brand-black/10 px-4 py-3 bg-brand-black/2">
                            <p className="text-sm text-brand-black/80 mb-4">{issue.description}</p>

                            {/* Action Button */}
                            {issue.actionType && (
                              <button
                                onClick={() => {
                                  handleActionClick(issue);
                                  if (issue.actionType === "create_task") {
                                    setCreatingTaskFor(issue.id);
                                  }
                                }}
                                className="w-full px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-black transition-colors"
                              >
                                → {issue.actionTitle}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-brand-black">✅ All clear!</p>
              <p className="text-sm text-brand-black/60 mt-2">
                This profile is in great health. No action needed right now.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-brand-black/10 px-8 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-brand-black/20 text-brand-black text-sm font-semibold hover:bg-brand-black/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

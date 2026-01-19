import React, { useState } from 'react';

interface ReportContent {
  executiveSummary: string;
  campaignObjective: string;
  timeline: {
    start: string;
    end: string;
    status: string;
  };
  creatorsInvolved: {
    count: number;
    breakdown: Array<{ status: string; count: number }>;
  };
  performance: {
    estimatedReach?: number;
    engagementMetrics?: string;
    highlights?: string[];
  };
  feedback: {
    brandFeedback: {
      positive: string[];
      concerns: string[];
    };
    approvalRate: number;
  };
  recommendations: string[];
  nextSteps: string[];
}

interface ReportApprovalPanelProps {
  reportId: string;
  campaignId: string;
  reportContent: ReportContent;
  status: 'DRAFT' | 'APPROVED' | 'RELEASED';
  generatedAt: string;
  onApprove: (reportId: string, content: ReportContent) => Promise<void>;
  onRelease: (reportId: string) => Promise<void>;
  onEditContent: (reportId: string, content: ReportContent) => Promise<void>;
  isLoading?: boolean;
}

export function ReportApprovalPanel({
  reportId,
  campaignId,
  reportContent,
  status,
  generatedAt,
  onApprove,
  onRelease,
  onEditContent,
  isLoading = false
}: ReportApprovalPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<ReportContent>(reportContent);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleEditSummary = (newSummary: string) => {
    setEditedContent(prev => ({
      ...prev,
      executiveSummary: newSummary
    }));
  };

  const handleAddRecommendation = () => {
    setEditedContent(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, '']
    }));
  };

  const handleEditRecommendation = (index: number, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((r, i) => i === index ? value : r)
    }));
  };

  const handleSaveEdits = async () => {
    setSubmitLoading(true);
    try {
      await onEditContent(reportId, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edits:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitLoading(true);
    try {
      await onApprove(reportId, editedContent);
    } catch (error) {
      console.error('Error approving report:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm('Release this report to the brand? They will be able to view it immediately.')) {
      return;
    }

    setSubmitLoading(true);
    try {
      await onRelease(reportId);
    } catch (error) {
      console.error('Error releasing report:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Campaign Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date(generatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'RELEASED' ? 'bg-green-100 text-green-800' :
            status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status === 'RELEASED' ? 'Released to Brand' : status === 'APPROVED' ? 'Approved' : 'Draft'}
          </span>
        </div>
      </div>

      {isEditing ? (
        // EDIT MODE
        <div className="space-y-6">
          {/* Executive Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Executive Summary
            </label>
            <textarea
              value={editedContent.executiveSummary}
              onChange={(e) => handleEditSummary(e.target.value)}
              disabled={submitLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Recommendations
              </label>
              <button
                onClick={handleAddRecommendation}
                disabled={submitLoading}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {editedContent.recommendations.map((rec, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={rec}
                  onChange={(e) => handleEditRecommendation(idx, e.target.value)}
                  disabled={submitLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Recommendation ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Edit Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSaveEdits}
              disabled={submitLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={submitLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // VIEW MODE
        <div className="space-y-6">
          {/* Executive Summary */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Executive Summary</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {editedContent.executiveSummary}
            </p>
          </section>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-1">Campaign Objective</p>
              <p className="text-sm font-semibold text-gray-900">{editedContent.campaignObjective}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-1">Approval Rate</p>
              <p className="text-sm font-semibold text-gray-900">{editedContent.feedback.approvalRate}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-1">Creators Involved</p>
              <p className="text-sm font-semibold text-gray-900">{editedContent.creatorsInvolved.count}</p>
            </div>
            {editedContent.performance.estimatedReach && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-1">Estimated Reach</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(editedContent.performance.estimatedReach / 1000).toFixed(0)}K
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h3>
            <div className="text-sm text-gray-700">
              <p>{editedContent.timeline.start} → {editedContent.timeline.end}</p>
              <p className="text-xs text-gray-500 mt-1">Status: {editedContent.timeline.status}</p>
            </div>
          </section>

          {/* Creator Breakdown */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Creator Status Breakdown</h3>
            <div className="space-y-2">
              {editedContent.creatorsInvolved.breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.status}</span>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Brand Feedback */}
          {(editedContent.feedback.brandFeedback.positive.length > 0 ||
            editedContent.feedback.brandFeedback.concerns.length > 0) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Brand Feedback Insights</h3>
              {editedContent.feedback.brandFeedback.positive.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-green-700 mb-2">✓ Positive Feedback</p>
                  <ul className="space-y-1">
                    {editedContent.feedback.brandFeedback.positive.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {editedContent.feedback.brandFeedback.concerns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-2">⚠ Concerns</p>
                  <ul className="space-y-1">
                    {editedContent.feedback.brandFeedback.concerns.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Recommendations */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommendations</h3>
            <ul className="space-y-2">
              {editedContent.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  <span className="font-medium">{idx + 1}.</span> {rec}
                </li>
              ))}
            </ul>
          </section>

          {/* Next Steps */}
          <section className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Next Steps</h3>
            <ul className="space-y-2">
              {editedContent.nextSteps.map((step, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  <span className="font-medium">→</span> {step}
                </li>
              ))}
            </ul>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            {status === 'DRAFT' && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Edit Report
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoading || submitLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {submitLoading ? 'Approving...' : 'Approve Report'}
                </button>
              </>
            )}
            {status === 'APPROVED' && (
              <button
                onClick={handleRelease}
                disabled={isLoading || submitLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitLoading ? 'Releasing...' : 'Release to Brand'}
              </button>
            )}
            {status === 'RELEASED' && (
              <div className="flex-1 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center">
                Released to Brand ✓
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

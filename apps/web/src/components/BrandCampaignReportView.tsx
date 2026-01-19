import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BrandCampaignReport {
  campaignId: string;
  campaignName: string;
  generatedAt: string;
  releasedAt?: string;
  report: {
    executiveSummary: string;
    campaignObjective: string;
    timeline: { start: string; end: string; status: string };
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
      brandFeedback: { positive: string[]; concerns: string[] };
      approvalRate: number;
    };
    recommendations: string[];
    nextSteps: string[];
  };
}

/**
 * BrandCampaignReportView - PART 4
 * 
 * Brand users can view:
 * - Executive summary
 * - Creator performance breakdown
 * - Approval/feedback metrics
 * - AI recommendations
 * - Next steps
 * 
 * Brand-safe content only (hides admin notes, internal decisions, costs)
 */
export const BrandCampaignReportView: React.FC<{
  campaignId: string;
  campaignName: string;
}> = ({ campaignId, campaignName }) => {
  const [reportData, setReportData] = useState<BrandCampaignReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json'>('pdf');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [campaignId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/brand/reports/campaigns/${campaignId}/report`);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // In production, would trigger actual PDF generation on backend
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${campaignName}_report.json`;
      link.click();
    } catch (err) {
      setError('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading campaign report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-yellow-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
        <p className="text-yellow-800 font-medium">{error}</p>
        <p className="text-yellow-700 text-sm mt-2">The report will be available after the campaign completes.</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600">No report available for this campaign yet.</p>
      </div>
    );
  }

  const report = reportData.report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{campaignName}</h1>
        <p className="text-blue-100">Campaign Report</p>
        <p className="text-sm text-blue-100 mt-2">Generated: {new Date(reportData.generatedAt).toLocaleDateString()}</p>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed">{report.executiveSummary}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaign Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Timeline</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Objective</p>
              <p className="text-gray-900 font-medium">{report.campaignObjective}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
              <p className="text-gray-900 font-medium">{report.timeline.start}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
              <p className="text-gray-900 font-medium">{report.timeline.end}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <p className="text-gray-900 font-medium">{report.timeline.status}</p>
            </div>
          </div>
        </div>

        {/* Creator Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Creator Breakdown</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Creators</p>
              <p className="text-3xl font-bold text-blue-600">{report.creatorsInvolved.count}</p>
            </div>
            <div className="space-y-2">
              {report.creatorsInvolved.breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{item.status}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {report.performance && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.performance.estimatedReach && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Estimated Reach</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(report.performance.estimatedReach / 1000).toFixed(0)}K
                </p>
              </div>
            )}
            {report.performance.engagementMetrics && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Engagement</p>
                <p className="text-lg font-semibold text-green-600">{report.performance.engagementMetrics}</p>
              </div>
            )}
          </div>

          {report.performance.highlights && report.performance.highlights.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Highlights</p>
              <ul className="space-y-2">
                {report.performance.highlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm text-gray-700 pl-4 relative">
                    <span className="absolute left-0">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Brand Feedback Summary */}
      {report.feedback && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Brand Feedback Summary</h3>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Approval Rate</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${report.feedback.approvalRate}%` }}
                ></div>
              </div>
              <p className="text-lg font-bold text-blue-600">{report.feedback.approvalRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.feedback.brandFeedback.positive.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-2 text-green-600">Positive Feedback</p>
                <ul className="space-y-1">
                  {report.feedback.brandFeedback.positive.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.feedback.brandFeedback.concerns.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-2 text-amber-600">Concerns Raised</p>
                <ul className="space-y-1">
                  {report.feedback.brandFeedback.concerns.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">AI Recommendations</h3>
          <ul className="space-y-3">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="text-gray-700 pl-4 relative">
                <span className="absolute left-0 text-blue-500">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {report.nextSteps && report.nextSteps.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
          <ol className="space-y-3">
            {report.nextSteps.map((step, idx) => (
              <li key={idx} className="text-gray-700 pl-6 relative">
                <span className="absolute left-0 font-bold text-blue-500">{idx + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Export Button */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-medium"
        >
          {exporting ? 'Exporting...' : '📥 Export Report'}
        </button>
      </div>
    </div>
  );
};

export default BrandCampaignReportView;

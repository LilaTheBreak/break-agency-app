import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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

interface CampaignReport {
  reportId: string;
  campaignId: string;
  reportContent: ReportContent;
  generatedAt: string;
  releasedAt: string;
  viewedAt?: string;
}

export function CampaignReportPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [campaignId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/brand/campaigns/${campaignId}/report`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    const exportData = {
      campaignId: report.campaignId,
      reportContent: report.reportContent,
      generatedAt: report.generatedAt,
      exportedAt: new Date().toISOString()
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2)));
    element.setAttribute('download', `campaign-report-${report.campaignId}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Unable to Load Report</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const content = report.reportContent;

  return (
    <div className="bg-gray-50 min-h-screen py-8 print:bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border print:border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaign Report</h1>
              <p className="text-gray-600 mt-2">Campaign ID: {report.campaignId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Generated: {new Date(report.generatedAt).toLocaleDateString()}
              </p>
              {report.viewedAt && (
                <p className="text-sm text-gray-600">
                  Viewed: {new Date(report.viewedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              ⬇️ Download
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
          <div className="p-6 space-y-8">
            {/* Executive Summary */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-800 leading-relaxed">{content.executiveSummary}</p>
              </div>
            </section>

            {/* Key Metrics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Campaign Objective</p>
                  <p className="text-lg font-bold text-gray-900">{content.campaignObjective}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Brand Approval Rate</p>
                  <p className="text-lg font-bold text-green-600">{content.feedback.approvalRate}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Creators Selected</p>
                  <p className="text-lg font-bold text-gray-900">{content.creatorsInvolved.count}</p>
                </div>
                {content.performance.estimatedReach && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Est. Reach</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(content.performance.estimatedReach / 1000000).toFixed(1)}M
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Campaign Timeline */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Timeline</h2>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">{content.timeline.start}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">{content.timeline.end}</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">{content.timeline.status}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Creator Status Breakdown */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Creator Status</h2>
              <div className="space-y-3">
                {content.creatorsInvolved.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">{item.status}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Performance Highlights */}
            {content.performance.highlights && content.performance.highlights.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Highlights</h2>
                <ul className="space-y-2">
                  {content.performance.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Brand Feedback Insights */}
            {(content.feedback.brandFeedback.positive.length > 0 ||
              content.feedback.brandFeedback.concerns.length > 0) && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Feedback Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.feedback.brandFeedback.positive.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3">✓ What Worked Well</h3>
                      <ul className="space-y-2">
                        {content.feedback.brandFeedback.positive.map((item, idx) => (
                          <li key={idx} className="text-sm text-green-800">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {content.feedback.brandFeedback.concerns.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-3">⚠ Areas for Improvement</h3>
                      <ul className="space-y-2">
                        {content.feedback.brandFeedback.concerns.map((item, idx) => (
                          <li key={idx} className="text-sm text-orange-800">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Recommendations */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations for Next Campaign</h2>
              <ul className="space-y-3">
                {content.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="font-bold text-blue-600 flex-shrink-0">{idx + 1}.</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Next Steps */}
            <section className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Recommended Next Steps</h2>
              <ul className="space-y-3">
                {content.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-blue-800">
                    <span className="font-bold flex-shrink-0">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200 text-center text-sm text-gray-600 print:text-xs">
              <p>This report was automatically generated from campaign data and brand feedback.</p>
              <p className="mt-2">Report ID: {report.reportId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid #e5e7eb !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:text-xs { font-size: 0.75rem !important; }
          section { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

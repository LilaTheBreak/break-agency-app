import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CampaignReport {
  id: string;
  campaignId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reportContent: any;
  generatedAt: string;
  approvedAt?: string;
  approvalNotes?: string;
}

/**
 * CampaignReportGenerator - PART 4
 * 
 * Admin workflow for:
 * 1. Generate AI report
 * 2. Review and edit content
 * 3. Approve or reject
 */
export const CampaignReportGenerator: React.FC<{
  campaignId: string;
  campaignName: string;
}> = ({ campaignId, campaignName }) => {
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [campaignId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/campaigns/${campaignId}/report`);
      setReport(response.data.report);
      setEditedContent(response.data.report?.reportContent);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to fetch report');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await axios.post(`/api/admin/campaigns/${campaignId}/generate-report`);
      setReport(response.data);
      setEditedContent(response.data.report);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const approveReport = async () => {
    if (!report) return;

    try {
      const response = await axios.put(
        `/api/admin/campaigns/${campaignId}/report/approve`,
        { approvalNotes: 'Approved by admin' }
      );
      setReport(response.data.report);
      setEditMode(false);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve report');
    }
  };

  const rejectReport = async (reason: string) => {
    if (!report || !reason) return;

    try {
      const response = await axios.put(
        `/api/admin/campaigns/${campaignId}/report/reject`,
        { rejectionReason: reason }
      );
      setReport(response.data.report);
      setEditMode(false);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject report');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading report...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900">{campaignName}</h2>
        <p className="text-gray-600 mt-1">Campaign Report Generation</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ Report {report?.status === 'APPROVED' ? 'approved' : report?.status === 'REJECTED' ? 'rejected' : 'generated'} successfully
        </div>
      )}

      {/* Report Status */}
      {!report ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-6">No report generated yet</p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
          >
            {generating ? 'Generating AI Report...' : 'Generate AI Report'}
          </button>
        </div>
      ) : (
        <>
          {/* Report Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Report Status: {report.status}</h3>
                <p className="text-blue-100 text-sm">Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
              </div>
              {report.approvedAt && (
                <div className="text-right">
                  <p className="text-sm">Approved</p>
                  <p className="text-xs text-blue-100">{new Date(report.approvedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
                <p className="text-gray-700">{report.reportContent?.executiveSummary}</p>
              </div>

              {/* Key Metrics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  {report.reportContent?.performance?.highlights?.map((highlight: string, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creators Involved */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Creator Breakdown</h4>
                <div className="space-y-2">
                  {report.reportContent?.creatorsInvolved?.breakdown?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{item.status}</span>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {report.reportContent?.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-700 pl-4 relative">
                      <span className="absolute left-0">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                <ul className="space-y-2">
                  {report.reportContent?.nextSteps?.map((step: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-700 pl-4 relative">
                      <span className="absolute left-0">→</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {report.status === 'PENDING_APPROVAL' && (
            <div className="bg-white rounded-lg shadow-md p-6 flex gap-3">
              <button
                onClick={approveReport}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
              >
                ✓ Approve Report
              </button>
              <button
                onClick={() => rejectReport('Needs revision')}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                ✕ Reject & Regenerate
              </button>
              <button
                onClick={generateReport}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                🔄 Regenerate
              </button>
            </div>
          )}

          {report.status === 'APPROVED' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Report Approved</p>
                    <p className="text-sm text-gray-600">This report is now visible to the brand</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampaignReportGenerator;

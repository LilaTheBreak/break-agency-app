import React, { useState, useEffect } from 'react';

const ScoreDisplay = ({ label, score }) => (
  <div className="text-center">
    <p className="text-2xl font-bold">{score?.toFixed(0) || 'N/A'}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const IssueCard = ({ issue }) => (
  <div className={`p-3 border-l-4 ${issue.severity === 'high' ? 'border-red-500' : 'border-yellow-500'}`}>
    <p className="font-semibold text-sm">{issue.type.replace('_', ' ')}</p>
    <p className="text-xs">{issue.description}</p>
  </div>
);

export default function DeliverableReviewPanel({ deliverableId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetchData();
  }, [deliverableId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/deliverables/${deliverableId}/ai-report`)
      .then(res => res.json())
      .then(setReport)
      .finally(() => setLoading(false));
  };

  const handleReview = async () => {
    setLoading(true);
    await fetch(`/api/deliverables/${deliverableId}/ai-review`, { method: 'POST' });
    // Poll for results
    setTimeout(fetchData, 5000);
  };

  if (loading && !report) return <div className="p-6 text-center">Loading AI review...</div>;

  if (!report) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleReview} disabled={loading} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          {loading ? 'Analyzing...' : 'Run AI Quality Review'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Quality Assurance Report</h2>
        <div className="text-right">
          <p className="font-bold text-4xl text-blue-500">{report.overallScore?.toFixed(0)}<span className="text-lg">/100</span></p>
          <p className="text-xs text-gray-500">Overall Score</p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <ScoreDisplay label="Brand Fit" score={report.brandGuidelinesScore} />
        <ScoreDisplay label="Brief Alignment" score={report.briefRequirementsScore} />
        <ScoreDisplay label="Compliance" score={report.complianceScore} />
        <ScoreDisplay label="Brand Safety" score={report.brandSafetyScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Issues Detected</h3>
          {report.issues.length > 0 ? (
            report.issues.map(issue => <IssueCard key={issue.id} issue={issue} />)
          ) : (
            <p className="text-sm text-green-600">No issues found. Looks good!</p>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">AI-Suggested Rewrites</h3>
          {(report.suggestedRewrites || []).map((rewrite, i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
              <p>{rewrite}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
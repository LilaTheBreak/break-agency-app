import React, { useState, useEffect } from 'react';

const RiskItem = ({ risk }) => {
  const severityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };
  return (
    <div className="p-3 border-t dark:border-gray-700">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-sm">{risk.category}</p>
        <span className={`px-2 py-0.5 text-xs rounded-full ${severityColors[risk.severity]}`}>{risk.severity}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{risk.description}</p>
    </div>
  );
};

export default function DeliverableQaPanel({ deliverableId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetchData();
  }, [deliverableId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/deliverable/${deliverableId}/qa`)
      .then(res => res.json())
      .then(setReport)
      .finally(() => setLoading(false));
  };

  const handleRunQa = async () => {
    setLoading(true);
    await fetch(`/api/deliverable/${deliverableId}/qa`, { method: 'POST' });
    setTimeout(fetchData, 5000); // Poll for results
  };

  if (loading && !report) return <div className="p-6 text-center">Running AI analysis...</div>;

  if (!report) {
    return (
      <div className="p-6 text-center">
        <button onClick={handleRunQa} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">
          Run AI Quality Assurance
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI QA Report</h2>
        <div className="text-right">
          <p className="font-bold text-4xl text-blue-500">{report.overallScore}<span className="text-lg">/100</span></p>
          <p className="text-xs text-gray-500">Overall Quality Score</p>
        </div>
      </header>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md mb-6">
        <p className="text-sm">{report.summary}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Risks Detected</h3>
        <div className="border rounded-md dark:border-gray-700">
          {(report.risks || []).map((risk, i) => <RiskItem key={i} risk={risk} />)}
        </div>
      </div>
    </div>
  );
}
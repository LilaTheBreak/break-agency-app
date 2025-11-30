import React from 'react';

const RedlineItem = ({ redline }) => (
  <div className="p-3 border-t dark:border-gray-700">
    <p className="text-xs font-semibold text-red-500">Risk: {redline.risk}</p>
    <p className="text-sm mt-1 p-2 bg-red-100 dark:bg-red-900/50 rounded-md line-through">{redline.originalText}</p>
    <p className="text-sm mt-2 p-2 bg-green-100 dark:bg-green-900/50 rounded-md">{redline.suggestedRedline}</p>
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md">
      <p className="text-xs font-bold text-blue-700 dark:text-blue-200">Negotiation Script:</p>
      <p className="text-sm italic">"{redline.negotiationCopy}"</p>
    </div>
  </div>
);

export default function UsageRightsPanel({ review }) {
  if (!review?.aiUsageDetected) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="font-bold text-lg">Usage Rights Analysis</h3>
        <p className="text-sm text-gray-500 mt-2">Run the AI review to analyze usage rights.</p>
      </div>
    );
  }

  const {
    aiUsageDetected,
    aiUsageValueEstimate,
    aiUsageRedlines,
    usageEndDate,
  } = review;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="mb-4">
        <h2 className="text-xl font-bold">AI Usage Rights Analysis</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Detected Terms</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm space-y-1">
              <p><strong>Duration:</strong> {aiUsageDetected.duration}</p>
              <p><strong>Channels:</strong> {aiUsageDetected.channels}</p>
              <p><strong>Territory:</strong> {aiUsageDetected.territory}</p>
              <p><strong>Expires:</strong> {usageEndDate ? new Date(usageEndDate).toLocaleDateString() : 'Perpetual'}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Estimated Value</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-center">
              <p className="text-3xl font-bold">{aiUsageValueEstimate.score}<span className="text-base">/100</span></p>
              <p className="text-xs text-gray-500">{aiUsageValueEstimate.justification}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Risks & Redlines</h4>
          {(aiUsageRedlines || []).map((redline, i) => <RedlineItem key={i} redline={redline} />)}
        </div>
      </div>
    </div>
  );
}
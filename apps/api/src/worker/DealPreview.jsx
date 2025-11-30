import React from 'react';

const InfoCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${className}`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <div className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{children}</div>
  </div>
);

const ActionButton = ({ children }) => (
  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
    {children}
  </button>
);

export default function DealPreview({ dealDraft }) {
  if (!dealDraft) {
    return <div>Loading Deal...</div>;
  }

  const {
    offerValue,
    offerCurrency,
    deliverables,
    usageRights,
    exclusivityTerms,
    risks,
    aiConfidence,
  } = dealDraft;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <div className="p-3 mb-4 text-center bg-blue-100 text-blue-800 rounded-md text-sm font-semibold">
        ⚡ This offer was auto-reconstructed from the email contents.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InfoCard title="Offer Value">
          {offerValue ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: offerCurrency || 'GBP' }).format(offerValue)}` : 'N/A'}
        </InfoCard>
        <InfoCard title="AI Confidence">
          <span className="text-green-500">{aiConfidence ? `${(aiConfidence * 100).toFixed(0)}%` : 'N/A'}</span>
        </InfoCard>
      </div>

      <div className="space-y-6">
        <InfoCard title="Deliverables">
          <ul className="list-disc list-inside">
            {(deliverables || []).map((d, i) => (
              <li key={i}>{d.count}x {d.platform} {d.type}</li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title="Usage Rights">
          {usageRights ? `${usageRights.type} for ${usageRights.duration} in ${usageRights.region}` : 'N/A'}
        </InfoCard>

        <InfoCard title="Exclusivity">
          {(exclusivityTerms || []).map((e, i) => (
            <p key={i}>{e.category} for {e.duration}</p>
          ))}
        </InfoCard>

        <InfoCard title="Risks & Red Flags" className="bg-red-50 dark:bg-red-900/50">
          <ul className="list-disc list-inside text-red-700 dark:text-red-300">
            {(risks || []).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </InfoCard>
      </div>

      <div className="mt-8 flex gap-4">
        <ActionButton>Approve & Create Deal</ActionButton>
        <ActionButton>Send to Negotiation Engine</ActionButton>
      </div>
    </div>
  );
}
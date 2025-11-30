import React, { useState, useEffect } from 'react';

const RiskCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${className}`}>
    <h3 className="font-bold text-lg mb-3">{title}</h3>
    <div className="text-sm space-y-2">{children}</div>
  </div>
);

const mockCampaign = {
  id: 'camp_123',
  title: 'Fall Fashion Launch',
  riskSummary: {
    risks: [{ type: 'SCHEDULING_PRESSURE', message: '3 deliverables are due in the next 3 days.' }],
    deliverableStatus: 'Overdue: 1, Due Soon: 3, Submitted: 2',
  },
  deliverables: [
    { id: 'del_1', title: 'IG Post 1', status: 'overdue', qaScore: null },
    { id: 'del_2', title: 'TikTok Video', status: 'submitted', qaScore: 85 },
    { id: 'del_3', title: 'IG Story Set', status: 'due_soon', qaScore: null },
  ],
};

export default function CampaignOpsDashboard() {
  const [campaign, setCampaign] = useState(mockCampaign);
  const [loading, setLoading] = useState(false);

  // In a real app, you'd fetch this data from `/api/campaign/:id/summary`

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Campaign Operations</h1>
        <button className="px-4 py-2 text-sm font-medium border rounded-md">Run Workflow Now</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RiskCard title="Deliverable Status" className="bg-blue-50 dark:bg-blue-900/50">
            <p>{campaign.riskSummary.deliverableStatus}</p>
            <div className="mt-4">
              <h4 className="font-semibold">Actionable Items:</h4>
              <ul className="list-disc list-inside">
                {campaign.deliverables.map(d => (
                  <li key={d.id} className="flex justify-between items-center">
                    <span>{d.title} - <span className="font-semibold">{d.status}</span></span>
                    {d.status === 'submitted' && <button className="text-xs text-blue-500">Run AI QA</button>}
                  </li>
                ))}
              </ul>
            </div>
          </RiskCard>

          <RiskCard title="AI QA Results">
            {campaign.deliverables.filter(d => d.qaScore).map(d => (
              <div key={d.id}>
                <p><strong>{d.title}:</strong> QA Score <span className="font-bold text-green-500">{d.qaScore}/100</span></p>
              </div>
            ))}
          </RiskCard>
        </div>

        <RiskCard title="Campaign Risks" className="bg-red-50 dark:bg-red-900/50">
          {(campaign.riskSummary.risks || []).map((risk, i) => (
            <p key={i} className="text-red-700 dark:text-red-200">{risk.message}</p>
          ))}
        </RiskCard>
      </div>
    </div>
  );
}
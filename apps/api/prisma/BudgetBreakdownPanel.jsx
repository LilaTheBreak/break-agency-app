import React, { useState, useEffect } from 'react';

const KPIChart = ({ forecast }) => (
  <div className="grid grid-cols-2 gap-4 text-center">
    <div>
      <p className="text-2xl font-bold">{forecast.totalViews?.toLocaleString()}</p>
      <p className="text-sm text-gray-500">Predicted Views</p>
    </div>
    <div>
      <p className="text-2xl font-bold">{forecast.totalEngagements?.toLocaleString()}</p>
      <p className="text-sm text-gray-500">Predicted Engagements</p>
    </div>
  </div>
);

const CreatorBudgetCard = ({ item }) => (
  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
    <div className="flex justify-between items-center">
      <p className="font-semibold">{item.talentName}</p>
      <p className="font-bold text-lg">£{item.allocation?.toLocaleString()}</p>
    </div>
    <p className="text-xs text-gray-500">
      {item.deliverables.map(d => `${d.count}x ${d.type}`).join(', ')}
    </p>
  </div>
);

export default function BudgetBreakdownPanel({ aiPlanId }) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aiPlanId) return;
    setLoading(true);
    // Poll for results
    const interval = setInterval(() => {
      fetch(`/api/campaign/${aiPlanId}/budget`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setBudget(data);
            setLoading(false);
            clearInterval(interval);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [aiPlanId]);

  if (loading) return <div className="p-6 text-center">AI is optimizing the budget...</div>;
  if (!budget) return null;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">AI Budget Optimizer</h2>
        <p className="text-sm text-gray-500">Recommended spend allocation to maximize KPIs.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">KPI Forecast</h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <KPIChart forecast={budget.forecast} />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Budget Breakdown (£{budget.allocatedBudget?.toLocaleString()})</h3>
          <div className="space-y-2">
            {(budget.breakdown || []).map((item, i) => <CreatorBudgetCard key={i} item={item} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
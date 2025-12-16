import React from 'react';

export default function BudgetRecommendationCard({ budgetMin, budgetMax }) {
  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-semibold">AI Budget Recommendation</h4>
      <p className="text-3xl font-bold text-green-500">
        ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 mt-1">This budget is optimized for your campaign goals and target audience.</p>
    </div>
  );
}
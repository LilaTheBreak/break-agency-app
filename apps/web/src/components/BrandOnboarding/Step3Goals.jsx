/**
 * Brand Onboarding - Step 3: Platform Goals
 * WHY are they here? Multi-select strategic goals
 * Collects: platformGoals
 */

import React, { useState } from 'react';

const BrandOnboardingStep3 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    platformGoals: data?.platformGoals || [],
  });

  const [errors, setErrors] = useState({});

  const goalOptions = [
    {
      id: 'brand-awareness',
      label: 'Brand Awareness',
      description: 'Increase visibility and reach with target audience',
    },
    {
      id: 'product-launch',
      label: 'Product Launch',
      description: 'Launch and promote new products or services',
    },
    {
      id: 'community-building',
      label: 'Community Building',
      description: 'Build engaged communities around our brand',
    },
    {
      id: 'sales-conversion',
      label: 'Sales & Conversion',
      description: 'Drive direct sales and revenue',
    },
    {
      id: 'thought-leadership',
      label: 'Thought Leadership',
      description: 'Position as industry authority',
    },
    {
      id: 'customer-retention',
      label: 'Customer Retention',
      description: 'Keep customers engaged and loyal',
    },
    {
      id: 'market-research',
      label: 'Market Research',
      description: 'Understand customer preferences and trends',
    },
    {
      id: 'crisis-management',
      label: 'Crisis Management',
      description: 'Manage reputation and brand safety',
    },
  ];

  const handleGoalToggle = (goalId) => {
    setFormData((prev) => ({
      ...prev,
      platformGoals: prev.platformGoals.includes(goalId)
        ? prev.platformGoals.filter((id) => id !== goalId)
        : [...prev.platformGoals, goalId],
    }));
    if (errors.platformGoals) {
      setErrors({ ...errors, platformGoals: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.platformGoals.length === 0) {
      newErrors.platformGoals = 'Please select at least one goal';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Goals Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What Are Your Platform Goals? *
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select all that apply. These help us tailor recommendations for maximum impact.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalOptions.map((goal) => (
              <label
                key={goal.id}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.platformGoals.includes(goal.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.platformGoals.includes(goal.id)}
                  onChange={() => handleGoalToggle(goal.id)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{goal.label}</p>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </div>
              </label>
            ))}
          </div>

          {errors.platformGoals && (
            <p className="text-red-500 text-sm mt-3">{errors.platformGoals}</p>
          )}

          {/* Selected Goals Summary */}
          {formData.platformGoals.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Selected: {formData.platformGoals.length} goal{formData.platformGoals.length !== 1 ? 's' : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.platformGoals.map((goalId) => {
                  const goal = goalOptions.find((g) => g.id === goalId);
                  return (
                    <span
                      key={goalId}
                      className="inline-block px-3 py-1 bg-blue-200 text-blue-900 text-sm rounded-full"
                    >
                      {goal.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            disabled={isSaving}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandOnboardingStep3;

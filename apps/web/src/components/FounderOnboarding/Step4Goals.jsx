import React, { useState } from 'react';

const FounderOnboardingStep4 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    primaryFounderGoals: data?.primaryFounderGoals || [],
  });

  const goalOptions = [
    'Build personal authority',
    'Drive inbound brand partnerships',
    'Support product launches',
    'Increase trust & conversion',
    'Position myself as a thought leader',
    'Long-term brand equity',
    'Speaking / press opportunities',
  ];

  const handleGoalToggle = (goal) => {
    setFormData((prev) => ({
      ...prev,
      primaryFounderGoals: prev.primaryFounderGoals.includes(goal)
        ? prev.primaryFounderGoals.filter((g) => g !== goal)
        : [...prev.primaryFounderGoals, goal],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Your Founder Goals
          </h2>
          <p className="text-gray-600">
            What are you hoping to achieve through founder-led strategy? (Select all that apply)
          </p>
        </div>

        <div className="space-y-3">
          {goalOptions.map((goal) => (
            <label key={goal} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.primaryFounderGoals.includes(goal)}
                onChange={() => handleGoalToggle(goal)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
              />
              <span className="ml-3 text-gray-900">{goal}</span>
            </label>
          ))}
        </div>

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
            disabled={isSaving || formData.primaryFounderGoals.length === 0}
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

export default FounderOnboardingStep4;

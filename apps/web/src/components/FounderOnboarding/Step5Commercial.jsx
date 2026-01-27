import React, { useState } from 'react';

const FounderOnboardingStep5 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    commercialIntent: data?.commercialIntent || '',
  });

  const options = [
    'Higher-quality brand partnerships',
    'Investor / industry credibility',
    'Direct customer growth',
    'Long-term positioning',
    "I'm not sure yet — I want guidance",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            What Will This Unlock?
          </h2>
          <p className="text-gray-600">
            What are you hoping founder-led strategy will unlock for you?
          </p>
        </div>

        <div className="space-y-3">
          {options.map((option) => (
            <label key={option} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="intent"
                value={option}
                checked={formData.commercialIntent === option}
                onChange={(e) =>
                  setFormData({ ...formData, commercialIntent: e.target.value })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
              />
              <span className="ml-3 text-gray-900">{option}</span>
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
            disabled={isSaving || !formData.commercialIntent}
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

export default FounderOnboardingStep5;

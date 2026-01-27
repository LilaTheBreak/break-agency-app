import React, { useState } from 'react';

const FounderOnboardingStep1 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    founderStage: data?.founderStage || '',
  });

  const options = [
    { value: 'pre_launch', label: 'Pre-launch', description: 'Idea or building quietly' },
    { value: 'early', label: 'Recently launched', description: 'Early traction' },
    { value: 'scaling', label: 'Actively running and growing', description: 'Building momentum' },
    { value: 'established', label: 'Established brand', description: 'Refining positioning' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.founderStage) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Where Are You Right Now?
          </h2>
          <p className="text-gray-600">
            Which best describes where you and your brand are in your journey?
          </p>
        </div>

        <div className="space-y-3">
          {options.map((option) => (
            <label key={option.value} className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="founderStage"
                value={option.value}
                checked={formData.founderStage === option.value}
                onChange={(e) =>
                  setFormData({ ...formData, founderStage: e.target.value })
                }
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
              />
              <div className="ml-3">
                <p className="text-lg font-medium text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
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
            disabled={isSaving || !formData.founderStage}
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

export default FounderOnboardingStep1;

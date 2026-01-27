import React, { useState } from 'react';

const FounderOnboardingStep6 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    biggestBlocker: data?.biggestBlocker || '',
  });

  const blockerOptions = [
    "Don't know what content to post",
    'No time',
    "Don't know how to position myself",
    'Inconsistent results',
    'Overwhelmed by platforms',
    'Other (describe below)',
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
            What's Holding You Back?
          </h2>
          <p className="text-gray-600">
            What's the biggest thing preventing you from being more visible right now?
          </p>
        </div>

        <div className="space-y-3">
          {blockerOptions.map((option) => (
            <label key={option} className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="blocker"
                value={option}
                checked={formData.biggestBlocker === option}
                onChange={(e) =>
                  setFormData({ ...formData, biggestBlocker: e.target.value })
                }
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
              />
              <span className="ml-3 text-gray-900">{option}</span>
            </label>
          ))}
        </div>

        {formData.biggestBlocker === 'Other (describe below)' && (
          <textarea
            placeholder="Tell us what's blocking you..."
            value={formData.biggestBlocker}
            onChange={(e) =>
              setFormData({ ...formData, biggestBlocker: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="4"
          />
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Next:</strong> Based on your answers, we'll recommend specific services and connect you with our team.
          </p>
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
            disabled={isSaving || !formData.biggestBlocker}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Completing...
              </>
            ) : (
              'Complete Onboarding'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FounderOnboardingStep6;

import React, { useState } from 'react';

const FounderOnboardingStep3 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    contentConfidence: data?.contentConfidence || '',
    timeCommitment: data?.timeCommitment || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.contentConfidence && formData.timeCommitment) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Your Content Confidence
          </h2>
          <p className="text-gray-600">
            We need to understand where you are right now.
          </p>
        </div>

        {/* Confidence Section */}
        <div className="space-y-4">
          <p className="font-medium text-gray-900">
            How confident do you feel creating content as the face of the brand?
          </p>
          <div className="space-y-3">
            {[
              {
                value: 'low',
                label: 'Not confident',
                description: 'I need guidance and support',
              },
              {
                value: 'medium',
                label: 'Comfortable',
                description: 'I post but need structure',
              },
              {
                value: 'high',
                label: 'Very confident',
                description: 'I want optimization',
              },
            ].map((option) => (
              <label key={option.value} className="flex items-start">
                <input
                  type="radio"
                  name="confidence"
                  value={option.value}
                  checked={formData.contentConfidence === option.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentConfidence: e.target.value,
                    })
                  }
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                />
                <div className="ml-3">
                  <p className="text-lg font-medium text-gray-900">
                    {option.label}
                  </p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Time Commitment Section */}
        <div className="space-y-4 border-t pt-6">
          <p className="font-medium text-gray-900">
            How much time can you realistically commit per week?
          </p>
          <div className="space-y-3">
            {[
              { value: 'low', label: '1–2 hours per week' },
              { value: 'medium', label: '3–5 hours per week' },
              { value: 'high', label: '5+ hours per week' },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="time"
                  value={option.value}
                  checked={formData.timeCommitment === option.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timeCommitment: e.target.value,
                    })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                />
                <span className="ml-3 text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
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
            disabled={isSaving || !formData.contentConfidence || !formData.timeCommitment}
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

export default FounderOnboardingStep3;

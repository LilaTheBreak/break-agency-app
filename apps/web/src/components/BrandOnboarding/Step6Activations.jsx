/**
 * Brand Onboarding - Step 6: Activations & Experiences
 * FINAL STEP - Optional but important
 * Collects: interestedInActivations, activationTypes
 * 
 * This step marks onboarding as complete and sets flags
 * to enable future routing and AI recommendations
 */

import React, { useState } from 'react';

const BrandOnboardingStep6 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    interestedInActivations: data?.interestedInActivations || false,
    activationTypes: data?.activationTypes || [],
  });

  const activationOptions = [
    {
      id: 'pop-ups',
      label: 'Pop-Up Events',
      description: 'Temporary branded experiences in high-traffic locations',
    },
    {
      id: 'experiential',
      label: 'Experiential Marketing',
      description: 'Immersive brand experiences with fan engagement',
    },
    {
      id: 'product-seeding',
      label: 'Product Seeding',
      description: 'Send products to influencers for authentic reviews',
    },
    {
      id: 'sampling',
      label: 'Sampling Campaigns',
      description: 'Distribution campaigns to introduce new products',
    },
    {
      id: 'vip-events',
      label: 'VIP & Exclusive Events',
      description: 'Invite-only experiences for high-value creators',
    },
    {
      id: 'branded-content',
      label: 'Branded Content Partnerships',
      description: 'Co-created content with creators',
    },
  ];

  const handleActivationsToggle = () => {
    setFormData((prev) => ({
      ...prev,
      interestedInActivations: !prev.interestedInActivations,
    }));
  };

  const handleActivationTypeToggle = (typeId) => {
    setFormData((prev) => ({
      ...prev,
      activationTypes: prev.activationTypes.includes(typeId)
        ? prev.activationTypes.filter((id) => id !== typeId)
        : [...prev.activationTypes, typeId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Introduction */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Are You Interested in Activations & Experiences?
          </h2>
          <p className="text-gray-600">
            Beyond social content, brands often explore experiential partnerships. Let us know if this interests you.
          </p>
        </div>

        {/* Activations Interest */}
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.interestedInActivations}
              onChange={handleActivationsToggle}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
            />
            <div className="ml-3">
              <p className="text-lg font-medium text-gray-900">
                Yes, we're open to activation opportunities
              </p>
              <p className="text-sm text-gray-600 mt-1">
                We'd like to explore pop-ups, events, and experiential partnerships
              </p>
            </div>
          </label>
        </div>

        {/* Activation Types (conditionally shown) */}
        {formData.interestedInActivations && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Which types interest you? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activationOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.activationTypes.includes(option.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.activationTypes.includes(option.id)}
                    onChange={() => handleActivationTypeToggle(option.id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 text-sm">{option.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-sm text-green-900">
            <strong>✓ You're almost done!</strong> Once you complete this step, your brand account will be fully set up 
            and you'll be able to start exploring partnership opportunities.
          </p>
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
            className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Completing Setup...
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

export default BrandOnboardingStep6;

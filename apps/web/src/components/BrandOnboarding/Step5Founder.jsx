/**
 * Brand Onboarding - Step 5: Founder-Led Check
 * CRITICAL BRANCHING LOGIC
 * 
 * If user:
 *   - Selects "Want Founder-Led Brand Building"
 *   - AND Role = Founder/Co-Founder
 *   → Automatically redirect to Founder Onboarding Flow
 */

import React, { useState } from 'react';

const BrandOnboardingStep5 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    wantsFounderLed: data?.wantsFounderLed || false,
  });

  const isFounder = 
    data?.signerRole?.includes('Founder') || 
    data?.signerRole?.includes('Co-Founder');

  const handleFounderLedChange = () => {
    setFormData((prev) => ({
      ...prev,
      wantsFounderLed: !prev.wantsFounderLed,
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
          <h2 className="text-xl font-semibold text-gray-900">
            Are You Interested in Founder-Led Brand Building?
          </h2>
          <p className="text-gray-600">
            This program pairs your brand with select founders who actively manage brand partnerships.
          </p>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Founder-Led Building</strong> means working directly with founders who take an active role in partnerships, 
              strategy development, and content creation. This typically results in more authentic partnerships and deeper engagement.
            </p>
          </div>
        </div>

        {/* Founder-Led Toggle */}
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.wantsFounderLed}
              onChange={handleFounderLedChange}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
            />
            <div className="ml-3">
              <p className="text-lg font-medium text-gray-900">
                Yes, I'm interested in founder-led partnerships
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Let us match you with founders who are actively building and can drive real impact
              </p>
            </div>
          </label>
        </div>

        {/* Conditional Message */}
        {formData.wantsFounderLed && isFounder && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-900">
              ✓ <strong>Great!</strong> Since you're a Founder/Co-Founder, we'll transition you to our specialized 
              Founder Onboarding program where you can explore founder-to-founder partnership opportunities.
            </p>
          </div>
        )}

        {formData.wantsFounderLed && !isFounder && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Next Steps:</strong> We'll introduce you to founders in our network who match your 
              brand values and objectives. You'll review profiles and we'll facilitate introductions.
            </p>
          </div>
        )}

        {!formData.wantsFounderLed && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              That's fine! We'll match you with a diverse range of creators across different follower counts and niches.
            </p>
          </div>
        )}

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
                {isFounder && formData.wantsFounderLed ? 'Redirecting...' : 'Saving...'}
              </>
            ) : isFounder && formData.wantsFounderLed ? (
              'Proceed to Founder Onboarding'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandOnboardingStep5;

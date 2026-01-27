/**
 * Brand Onboarding - Step 5: Founder-Led Brand Growth
 * CRITICAL BRANCHING LOGIC
 * 
 * This step determines if the person signing up is a founder and wants to
 * grow their brand using founder-led social & marketing strategy.
 */

import React, { useState } from 'react';

const BrandOnboardingStep5 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    wantsFounderLed: data?.wantsFounderLed || false,
    isBrandFounder: data?.isBrandFounder || false,
  });

  const isFounder = 
    data?.signerRole?.includes('Founder') || 
    data?.signerRole?.includes('Co-Founder');

  const handleFounderLedChange = () => {
    setFormData((prev) => ({
      ...prev,
      wantsFounderLed: !prev.wantsFounderLed,
      isBrandFounder: !prev.wantsFounderLed, // Set to true when selecting founder-led
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
            Are You Interested in Founder-Led Brand Growth?
          </h2>
          <p className="text-gray-600">
            Founder-led brand growth focuses on building your brand through you — your voice, story, and visibility — rather than relying only on ads or creators.
          </p>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Founder-Led Strategy</strong> means positioning you, the founder, as part of the brand's growth engine. This includes founder-led content, thought leadership, partnerships, and storytelling designed to build trust, authority, and long-term brand value.
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
                Yes — I'm a founder and want to grow my brand through founder-led marketing
              </p>
              <p className="text-sm text-gray-600 mt-1">
                We'll work with you on founder-led strategy, positioning, content, and partnerships with you at the centre of the brand.
              </p>
            </div>
          </label>
        </div>

        {/* Secondary Helper Text */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            That's okay — you can still use The Break for creator partnerships, campaigns, and brand activations without founder-led strategy.
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

export default BrandOnboardingStep5;

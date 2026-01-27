/**
 * Brand Onboarding - Step 4: Commercial Focus
 * WHAT are they trying to achieve commercially?
 * Collects: primaryObjective, productFocus, desiredOutcome
 */

import React, { useState } from 'react';

const BrandOnboardingStep4 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    primaryObjective: data?.primaryObjective || '',
    productFocus: data?.productFocus || '',
    desiredOutcome: data?.desiredOutcome || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.primaryObjective.trim()) {
      newErrors.primaryObjective = 'Primary objective is required';
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-900">
            Tell us about your commercial strategy. This helps us find creators and campaigns that align with your objectives.
          </p>
        </div>

        {/* Primary Objective */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's Your Primary Objective? *
          </label>
          <p className="text-xs text-gray-500 mb-3">
            e.g., "Increase revenue by 25%", "Launch product in Q2", "Build brand loyalty"
          </p>
          <textarea
            name="primaryObjective"
            value={formData.primaryObjective}
            onChange={handleChange}
            placeholder="Describe your main business objective..."
            rows="3"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none ${
              errors.primaryObjective ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.primaryObjective && (
            <p className="text-red-500 text-sm mt-1">{errors.primaryObjective}</p>
          )}
        </div>

        {/* Product Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What Products/Services Will Be Promoted?
          </label>
          <p className="text-xs text-gray-500 mb-3">
            e.g., "Luxury skincare line", "Fitness app subscription", "Premium apparel collection"
          </p>
          <textarea
            name="productFocus"
            value={formData.productFocus}
            onChange={handleChange}
            placeholder="Describe your products or services..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Desired Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's Your Desired Outcome?
          </label>
          <p className="text-xs text-gray-500 mb-3">
            e.g., "1M impressions", "$500K in revenue", "10K new customers"
          </p>
          <textarea
            name="desiredOutcome"
            value={formData.desiredOutcome}
            onChange={handleChange}
            placeholder="Describe what success looks like..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
          />
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

export default BrandOnboardingStep4;

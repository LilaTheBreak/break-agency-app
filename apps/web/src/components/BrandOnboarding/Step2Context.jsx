/**
 * Brand Onboarding - Step 2: Sign-Up Context
 * WHO is this person? What's their role and decision authority?
 * Collects: signerRole, decisionAuthority
 */

import React, { useState } from 'react';

const BrandOnboardingStep2 = ({ data, onSave, onSkip, isSaving }) => {
  const [formData, setFormData] = useState({
    signerRole: data?.signerRole || '',
    decisionAuthority: data?.decisionAuthority || '',
  });

  const [errors, setErrors] = useState({});

  const roles = [
    'Founder/Co-Founder',
    'CEO/President',
    'CMO/VP Marketing',
    'Head of Marketing',
    'Marketing Manager',
    'Growth Lead',
    'Brand Manager',
    'Social Media Manager',
    'Agency Partner',
    'Other',
  ];

  const decisionAuthorityOptions = [
    {
      value: 'final',
      label: 'Final Decision Maker',
      description: 'I make the final decision on brand partnerships',
    },
    {
      value: 'influencer',
      label: 'Influencer',
      description: 'I have significant influence but others decide',
    },
    {
      value: 'research',
      label: 'Researcher',
      description: 'I gather information for others to decide',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleDecisionAuthorityChange = (value) => {
    setFormData({ ...formData, decisionAuthority: value });
    if (errors.decisionAuthority) {
      setErrors({ ...errors, decisionAuthority: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.signerRole) {
      newErrors.signerRole = 'Please select your role';
    }
    if (!formData.decisionAuthority) {
      newErrors.decisionAuthority = 'Please select your decision authority';
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
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What's Your Role? *
          </label>
          <div className="space-y-2">
            <select
              name="signerRole"
              value={formData.signerRole}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${
                errors.signerRole ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select your role</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {errors.signerRole && (
            <p className="text-red-500 text-sm mt-1">{errors.signerRole}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            This helps us tailor recommendations to your level of responsibility
          </p>
        </div>

        {/* Decision Authority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            What's Your Decision Authority? *
          </label>
          <div className="space-y-3">
            {decisionAuthorityOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.decisionAuthority === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="decisionAuthority"
                  value={option.value}
                  checked={formData.decisionAuthority === option.value}
                  onChange={() => handleDecisionAuthorityChange(option.value)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-600"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.decisionAuthority && (
            <p className="text-red-500 text-sm mt-2">{errors.decisionAuthority}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onSkip}
            disabled={isSaving}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
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

export default BrandOnboardingStep2;

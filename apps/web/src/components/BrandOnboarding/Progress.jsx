/**
 * Brand Onboarding Progress Indicator
 * Shows current step progress in the 6-step wizard
 */

import React from 'react';

const BrandOnboardingProgress = ({ currentStep, totalSteps = 6 }) => {
  const stepLabels = [
    'Company Basics',
    'Your Role',
    'Platform Goals',
    'Commercial Focus',
    'Founder-Led?',
    'Activations'
  ];

  return (
    <div className="mb-8">
      {/* Step Number and Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Step {currentStep} of {totalSteps}
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          {stepLabels[currentStep - 1]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
          ></div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center max-w-xs">
                {stepLabels[step - 1]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandOnboardingProgress;

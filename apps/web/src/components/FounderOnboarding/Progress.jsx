import React, { useState } from 'react';

const FounderOnboardingProgress = ({ currentStep, totalSteps = 6 }) => {
  const stepsLabels = [
    'Founder Stage',
    'Social Presence',
    'Confidence',
    'Goals',
    'Intent',
    'Blockers',
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          ONBOARDING PROGRESS
        </h3>
        <span className="text-xs font-semibold text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex-1">
            <div
              className={`h-2 rounded-full transition-all ${
                i < currentStep ? 'bg-red-600' : 'bg-gray-200'
              }`}
            />
            <p className="text-xs text-gray-600 mt-2 text-center">
              {stepsLabels[i]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FounderOnboardingProgress;

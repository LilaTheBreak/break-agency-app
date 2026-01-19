import React, { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * BrandOnboardingChecklist
 * 
 * Guides brands through signup → first campaign with clear progress and trust signals.
 * 
 * Steps:
 * 1. Complete Brand Profile (company name, website, industry, contact)
 * 2. Connect Billing (payment method, billing contact)
 * 3. Define Campaign Goals (awareness/conversion/launch, platforms, budget)
 * 4. Review Creator Matches (AI-generated shortlist)
 * 5. Approve First Campaign (timeline, creators, deliverables)
 * 
 * Features:
 * - Progress bar showing completion
 * - Lock advanced features until steps complete
 * - Replace blank states with "Next step" CTAs
 * - Persist completion state to DB
 */
export function BrandOnboardingChecklist({ onboarding, onComplete }) {
  const [steps, setSteps] = useState([
    {
      id: "profile",
      title: "Complete Brand Profile",
      description: "Tell us about your company",
      fields: ["Company name", "Website", "Industry", "Primary contact"],
      completed: false,
      order: 1
    },
    {
      id: "billing",
      title: "Connect Billing",
      description: "Add payment method",
      fields: ["Payment method", "Billing contact"],
      completed: false,
      order: 2,
      locked: true
    },
    {
      id: "goals",
      title: "Define Campaign Goals",
      description: "What do you want to achieve?",
      fields: ["Goal type", "Target platforms", "Budget range"],
      completed: false,
      order: 3,
      locked: true
    },
    {
      id: "creators",
      title: "Review Creator Matches",
      description: "See AI-recommended creators",
      fields: ["View recommendations", "Build shortlist"],
      completed: false,
      order: 4,
      locked: true
    },
    {
      id: "approve",
      title: "Approve First Campaign",
      description: "Launch your first campaign",
      fields: ["Select creators", "Set timeline", "Review deliverables"],
      completed: false,
      order: 5,
      locked: true
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  // Unlock steps based on previous completion
  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map((step, idx) => ({
        ...step,
        locked: idx > 0 && !prevSteps[idx - 1].completed
      }))
    );
  }, []);

  const markStepComplete = async (stepId) => {
    try {
      await apiFetch("/api/brand/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ completedStep: stepId })
      });

      setSteps(prevSteps =>
        prevSteps.map(step => ({
          ...step,
          completed: step.id === stepId ? true : step.completed
        }))
      );

      // Check if all steps done
      if (completedCount + 1 === steps.length) {
        onComplete?.();
      }
    } catch (error) {
      console.error("Failed to mark step complete:", error);
    }
  };

  const currentStepData = steps[currentStep];
  const isStepLocked = currentStepData?.locked;

  return (
    <div className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Setup</p>
            <h2 className="font-display text-2xl uppercase">Brand Onboarding</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-brand-black">{completedCount}</p>
            <p className="text-xs text-brand-black/60">of {steps.length} steps</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-brand-black/10">
          <div
            className="h-full bg-brand-red transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => !isStepLocked && setCurrentStep(idx)}
            disabled={step.locked}
            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
              currentStep === idx
                ? "border-brand-red bg-brand-red/10"
                : step.completed
                ? "border-brand-black/20 bg-brand-linen/30"
                : "border-brand-black/20 bg-brand-white hover:bg-brand-linen/20"
            } ${step.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-start gap-3">
              {/* Step Number or Checkmark */}
              <div
                className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  step.completed
                    ? "bg-brand-red text-brand-white"
                    : currentStep === idx
                    ? "bg-brand-red text-brand-white"
                    : "bg-brand-black/10 text-brand-black/60"
                }`}
              >
                {step.completed ? "✓" : idx + 1}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-black">{step.title}</p>
                <p className="text-xs text-brand-black/60 mt-1">{step.description}</p>

                {/* Fields for current step */}
                {currentStep === idx && !step.locked && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-brand-black/10">
                    {step.fields.map((field, fidx) => (
                      <div key={fidx} className="text-xs text-brand-black/70 flex items-center gap-2">
                        <span className="text-brand-red">▪</span>
                        {field}
                      </div>
                    ))}
                  </div>
                )}

                {step.locked && (
                  <p className="text-xs text-brand-black/50 mt-2">Complete previous steps to unlock</p>
                )}
              </div>

              {/* Status */}
              {step.completed && (
                <div className="flex-shrink-0 text-sm font-semibold text-brand-red">Done</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Current Step CTA */}
      {!isStepLocked && currentStepData && (
        <div className="space-y-3 rounded-2xl bg-brand-linen/30 p-4">
          <p className="text-sm font-semibold text-brand-black">Next: {currentStepData.title}</p>
          <button
            onClick={() => markStepComplete(currentStepData.id)}
            className="w-full rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-red/90 transition-colors"
          >
            {currentStepData.completed ? "Completed ✓" : "Mark as Complete"}
          </button>
        </div>
      )}

      {/* Completion Message */}
      {completedCount === steps.length && (
        <div className="rounded-2xl border border-brand-red/30 bg-brand-red/10 p-4 text-center">
          <p className="font-semibold text-brand-black">🎉 Setup Complete!</p>
          <p className="mt-2 text-sm text-brand-black/70">Your account is ready. Start exploring creators and building campaigns.</p>
        </div>
      )}
    </div>
  );
}

export default BrandOnboardingChecklist;

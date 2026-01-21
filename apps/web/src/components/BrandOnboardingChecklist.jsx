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
 * - All steps are clickable and editable
 * - Persist completion state to DB
 * - Load saved progress on mount
 */
export function BrandOnboardingChecklist({ onboarding, onComplete }) {
  const initialSteps = [
    {
      id: "profile",
      title: "Complete Brand Profile",
      description: "Tell us about your company",
      fields: ["Company name", "Website", "Industry", "Primary contact"],
      formFields: {
        companyName: "",
        website: "",
        industry: "",
        primaryContact: ""
      },
      completed: false,
      order: 1
    },
    {
      id: "billing",
      title: "Connect Billing",
      description: "Add payment method",
      fields: ["Payment method", "Billing contact"],
      formFields: {
        paymentMethod: "",
        billingContact: ""
      },
      completed: false,
      order: 2
    },
    {
      id: "goals",
      title: "Define Campaign Goals",
      description: "What do you want to achieve?",
      fields: ["Goal type", "Target platforms", "Budget range"],
      formFields: {
        goalType: "",
        targetPlatforms: [],
        budgetRange: ""
      },
      completed: false,
      order: 3
    },
    {
      id: "creators",
      title: "Review Creator Matches",
      description: "See AI-recommended creators",
      fields: ["View recommendations", "Build shortlist"],
      formFields: {
        reviewedMatches: false,
        savedToShortlist: false
      },
      completed: false,
      order: 4
    },
    {
      id: "approve",
      title: "Approve First Campaign",
      description: "Launch your first campaign",
      fields: ["Select creators", "Set timeline", "Review deliverables"],
      formFields: {
        selectedCreators: [],
        campaignTimeline: "",
        deliverables: ""
      },
      completed: false,
      order: 5
    }
  ];

  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  // Load onboarding status from database on mount
  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  // Update step locking based on completion status
  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map((step, idx) => ({
        ...step
      }))
    );
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const response = await apiFetch("/api/brand/onboarding");
      if (response.ok) {
        const data = await response.json();
        // Update steps based on saved status
        setSteps(prevSteps =>
          prevSteps.map(step => ({
            ...step,
            completed: data[step.id] === true
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (stepId) => {
    try {
      setIsSaving(true);
      const response = await apiFetch("/api/brand/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ completedStep: stepId })
      });

      if (response.ok) {
        const result = await response.json();
        
        setSteps(prevSteps =>
          prevSteps.map(step => ({
            ...step,
            completed: result.onboardingStatus?.[step.id] === true || step.completed
          }))
        );

        // Check if all steps done
        const newCompletedCount = steps.filter(s => s.id === stepId).length + completedCount;
        if (newCompletedCount === steps.length || Object.keys(result.onboardingStatus || {}).length === steps.length) {
          onComplete?.();
        }
      }
    } catch (error) {
      console.error("Failed to mark step complete:", error);
      alert("Error saving progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStepForm = (stepId, field, value) => {
    setSteps(prevSteps =>
      prevSteps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            formFields: {
              ...step.formFields,
              [field]: value
            }
          };
        }
        return step;
      })
    );
  };

  const currentStepData = steps[currentStep];

  if (loading) {
    return (
      <div className="space-y-6 section-wrapper elevation-1 p-6 transition-elevation">
        <p className="text-center text-brand-black/60">Loading onboarding progress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 section-wrapper elevation-1 p-6 transition-elevation">
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
            onClick={() => setCurrentStep(idx)}
            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
              currentStep === idx
                ? "border-brand-red bg-brand-red/10"
                : step.completed
                ? "border-brand-black/20 bg-brand-linen/30"
                : "border-brand-black/20 bg-brand-white hover:bg-brand-linen/20"
            } cursor-pointer`}
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
                {currentStep === idx && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-brand-black/10">
                    {step.fields.map((field, fidx) => (
                      <div key={fidx} className="text-xs text-brand-black/70 flex items-center gap-2">
                        <span className="text-brand-red">▪</span>
                        {field}
                      </div>
                    ))}
                  </div>
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

      {/* Current Step Editor */}
      {currentStepData && (
        <div className="space-y-4 rounded-2xl bg-brand-linen/30 p-4">
          <div>
            <p className="text-sm font-semibold text-brand-black mb-3">{currentStepData.title}</p>
            
            {/* Step-specific form fields */}
            {currentStepData.id === "profile" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Company name"
                  value={currentStepData.formFields.companyName || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "companyName", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="Website URL"
                  value={currentStepData.formFields.website || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "website", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Industry"
                  value={currentStepData.formFields.industry || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "industry", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Primary contact email"
                  value={currentStepData.formFields.primaryContact || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "primaryContact", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>
            )}

            {currentStepData.id === "billing" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Payment method (e.g., Credit Card)"
                  value={currentStepData.formFields.paymentMethod || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "paymentMethod", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Billing contact email"
                  value={currentStepData.formFields.billingContact || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "billingContact", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>
            )}

            {currentStepData.id === "goals" && (
              <div className="space-y-3">
                <select
                  value={currentStepData.formFields.goalType || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "goalType", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                >
                  <option value="">Select campaign goal...</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="conversion">Conversion</option>
                  <option value="launch">Product Launch</option>
                  <option value="engagement">Engagement</option>
                </select>
                <input
                  type="text"
                  placeholder="Target platforms (e.g., Instagram, TikTok)"
                  value={currentStepData.formFields.targetPlatforms?.join(", ") || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "targetPlatforms", e.target.value.split(",").map(p => p.trim()))}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Budget range"
                  value={currentStepData.formFields.budgetRange || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "budgetRange", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>
            )}

            {currentStepData.id === "creators" && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-brand-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentStepData.formFields.reviewedMatches || false}
                    onChange={(e) => updateStepForm(currentStepData.id, "reviewedMatches", e.target.checked)}
                    className="w-4 h-4 rounded border-brand-black/20"
                  />
                  I've reviewed the AI-recommended creators
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentStepData.formFields.savedToShortlist || false}
                    onChange={(e) => updateStepForm(currentStepData.id, "savedToShortlist", e.target.checked)}
                    className="w-4 h-4 rounded border-brand-black/20"
                  />
                  I've saved creators to my shortlist
                </label>
              </div>
            )}

            {currentStepData.id === "approve" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Selected creators"
                  value={currentStepData.formFields.selectedCreators?.join(", ") || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "selectedCreators", e.target.value.split(",").map(c => c.trim()))}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Campaign timeline"
                  value={currentStepData.formFields.campaignTimeline || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "campaignTimeline", e.target.value)}
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
                <textarea
                  placeholder="Deliverables overview"
                  value={currentStepData.formFields.deliverables || ""}
                  onChange={(e) => updateStepForm(currentStepData.id, "deliverables", e.target.value)}
                  rows="3"
                  className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => markStepComplete(currentStepData.id)}
            disabled={isSaving}
            className="w-full rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : currentStepData.completed ? "✓ Completed" : "Save & Mark Complete"}
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

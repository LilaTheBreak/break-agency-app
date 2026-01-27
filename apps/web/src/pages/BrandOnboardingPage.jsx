/**
 * Brand Onboarding Flow
 * 
 * A 6-step wizard that captures brand strategy and platform fit:
 * 1. Company Basics (name, website, industry, markets)
 * 2. Sign-Up Context (role, decision authority)
 * 3. Platform Goals (multi-select of strategic goals)
 * 4. Commercial Focus (objective, products, outcomes)
 * 5. Founder-Led Check (branching logic - founder redirect)
 * 6. Activations & Experiences (optional - pop-ups, events, etc.)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient.js';
import BrandOnboardingStep1 from '../components/BrandOnboarding/Step1Basics';
import BrandOnboardingStep2 from '../components/BrandOnboarding/Step2Context';
import BrandOnboardingStep3 from '../components/BrandOnboarding/Step3Goals';
import BrandOnboardingStep4 from '../components/BrandOnboarding/Step4Commercial';
import BrandOnboardingStep5 from '../components/BrandOnboarding/Step5Founder';
import BrandOnboardingStep6 from '../components/BrandOnboarding/Step6Activations';
import BrandOnboardingProgress from '../components/BrandOnboarding/Progress';

const BrandOnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize onboarding on mount
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/brands/onboarding/current');

        if (!response.ok) {
          // Profile doesn't exist yet, start new onboarding
          const startResponse = await apiFetch('/api/brands/onboarding/start', {
            method: 'POST',
          });

          if (!startResponse.ok) {
            throw new Error('Failed to start onboarding');
          }

          const startData = await startResponse.json();
          setData(startData);
          setCurrentStep(1);
        } else {
          const profileData = await response.json();
          setData(profileData);
          setCurrentStep(profileData.currentStep || 1);
        }
        setError(null);
      } catch (err) {
        console.error('Error initializing onboarding:', err);
        setError('Failed to load onboarding. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeOnboarding();
  }, []);

  const handleSaveStep = async (stepData) => {
    try {
      setIsSaving(true);

      const response = await apiFetch(`/api/brands/onboarding/step/${currentStep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save step');
      }

      const updatedData = await response.json();
      setData(updatedData);

      // Check if redirect to founder onboarding is needed (Step 5 only)
      if (currentStep === 5 && updatedData.redirectToFounderOnboarding) {
        // Redirect to founder onboarding flow
        navigate('/onboarding/founder');
        return;
      }

      // Check if onboarding is complete (Step 6)
      if (currentStep === 6) {
        // Redirect to brand dashboard
        navigate('/brand/dashboard');
        return;
      }

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.error('Error saving step:', err);
      setError(err.message || 'Failed to save step. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipStep = async () => {
    try {
      setIsSaving(true);

      const response = await apiFetch(
        `/api/brands/onboarding/skip/${currentStep}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Cannot skip this step');
      }

      const updatedData = await response.json();
      setData(updatedData);
      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.error('Error skipping step:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your brand account...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load onboarding'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <BrandOnboardingProgress currentStep={currentStep} totalSteps={6} />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step Components */}
        {currentStep === 1 && (
          <BrandOnboardingStep1
            data={data}
            onSave={handleSaveStep}
            onSkip={handleSkipStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 2 && (
          <BrandOnboardingStep2
            data={data}
            onSave={handleSaveStep}
            onSkip={handleSkipStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 3 && (
          <BrandOnboardingStep3
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 4 && (
          <BrandOnboardingStep4
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 5 && (
          <BrandOnboardingStep5
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 6 && (
          <BrandOnboardingStep6
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};

export default BrandOnboardingPage;

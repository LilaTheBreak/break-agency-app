/**
 * Founder Onboarding Flow
 * 
 * A 6-step diagnostic that captures founder strategy and service fit:
 * 1. Founder Stage (pre-launch, early, scaling, established)
 * 2. Social Presence Audit (active? which platforms?)
 * 3. Content & Visibility Confidence (confidence level + time commitment)
 * 4. Founder Goals (multi-select of founder goals)
 * 5. Commercial Intent (what will founder-led strategy unlock?)
 * 6. Biggest Blocker (diagnostic - what's holding them back?)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../services/apiClient.js';
import FounderStep1Stage from '../components/FounderOnboarding/Step1Stage';
import FounderStep2Social from '../components/FounderOnboarding/Step2Social';
import FounderStep3Confidence from '../components/FounderOnboarding/Step3Confidence';
import FounderStep4Goals from '../components/FounderOnboarding/Step4Goals';
import FounderStep5Commercial from '../components/FounderOnboarding/Step5Commercial';
import FounderStep6Blocker from '../components/FounderOnboarding/Step6Blocker';
import FounderOnboardingProgress from '../components/FounderOnboarding/Progress';

const FounderOnboardingPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
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
        const response = await apiFetch('/api/founders/onboarding/current');

        if (!response.ok) {
          // Profile doesn't exist yet, start new onboarding
          const startResponse = await apiFetch('/api/founders/onboarding/start', {
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

      const response = await apiFetch(`/api/founders/onboarding/step/${currentStep}`, {
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

      // Check if onboarding is complete (Step 6)
      if (currentStep === 6) {
        // Refresh user to update onboarding_status to 'completed'
        await refreshUser();
        // Redirect to founder dashboard
        navigate('/founder/dashboard');
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
        `/api/founders/onboarding/skip/${currentStep}`,
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
          <p className="text-gray-600">Setting up your founder account...</p>
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
        <FounderOnboardingProgress currentStep={currentStep} totalSteps={6} />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step Components */}
        {currentStep === 1 && (
          <FounderStep1Stage
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 2 && (
          <FounderStep2Social
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 3 && (
          <FounderStep3Confidence
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 4 && (
          <FounderStep4Goals
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 5 && (
          <FounderStep5Commercial
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}

        {currentStep === 6 && (
          <FounderStep6Blocker
            data={data}
            onSave={handleSaveStep}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};

export default FounderOnboardingPage;

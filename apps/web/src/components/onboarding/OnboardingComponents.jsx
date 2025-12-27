import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ArrowRight } from 'lucide-react';

/**
 * First-time user onboarding system
 * Shows contextual hints and guides for new users
 */

/**
 * Onboarding checklist component
 * Tracks user progress through setup steps
 */
export function OnboardingChecklist({ steps, onComplete, onDismiss }) {
  const [completedSteps, setCompletedSteps] = useState([]);

  const allStepsCompleted = steps.every(step => completedSteps.includes(step.id));

  useEffect(() => {
    if (allStepsCompleted && onComplete) {
      onComplete();
    }
  }, [allStepsCompleted, onComplete]);

  const toggleStep = (stepId) => {
    setCompletedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Get Started with Break Agency
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Complete these steps to set up your account
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">
            {completedSteps.length} of {steps.length} completed
          </span>
          <span className="text-gray-600">
            {Math.round((completedSteps.length / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleStep(step.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
              </button>

              <div className="flex-1">
                <h4
                  className={`text-sm font-medium mb-1 ${
                    isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                {!isCompleted && step.action && (
                  <button
                    onClick={step.action.onClick}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {step.action.text}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allStepsCompleted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            🎉 All set! You're ready to use Break Agency.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Feature announcement component
 * Introduces new features to existing users
 */
export function FeatureAnnouncement({ feature, onDismiss, onTryIt }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {feature.icon && (
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
              {feature.icon}
            </div>
          )}
          <div>
            <div className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full mb-1">
              NEW
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {feature.title}
            </h3>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-4">{feature.description}</p>

      <div className="flex items-center gap-3">
        {onTryIt && (
          <button
            onClick={onTryIt}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try it now
          </button>
        )}
        {feature.learnMoreUrl && (
          <a
            href={feature.learnMoreUrl}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Learn more
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Quick tip component
 * Shows contextual tips based on user's current page
 */
export function QuickTip({ tip, onDismiss }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          💡
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-900 mb-1">
            Quick Tip
          </h4>
          <p className="text-sm text-yellow-800">{tip}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * First-time page visit banner
 * Shows help for specific pages on first visit
 */
export function FirstVisitBanner({ title, description, actions, onDismiss }) {
  return (
    <div className="bg-blue-600 text-white rounded-lg shadow-lg p-5 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-blue-100">{description}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                action.primary
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-700 text-white hover:bg-blue-800'
              }`}
            >
              {action.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Onboarding hook to manage onboarding state
 */
export function useOnboarding(userId, page) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [dismissedTips, setDismissedTips] = useState([]);

  useEffect(() => {
    // Check localStorage for first visit
    const visitKey = `onboarding_${userId}_${page}`;
    const hasVisited = localStorage.getItem(visitKey);
    
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem(visitKey, 'true');
    }

    // Load dismissed tips
    const dismissedKey = `dismissed_tips_${userId}`;
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
    setDismissedTips(dismissed);
  }, [userId, page]);

  const dismissTip = (tipId) => {
    const updated = [...dismissedTips, tipId];
    setDismissedTips(updated);
    localStorage.setItem(`dismissed_tips_${userId}`, JSON.stringify(updated));
  };

  const hasDismissedTip = (tipId) => {
    return dismissedTips.includes(tipId);
  };

  return {
    isFirstVisit,
    dismissTip,
    hasDismissedTip,
  };
}

/**
 * Default onboarding steps for different user roles
 */
export const DEFAULT_ONBOARDING_STEPS = {
  brand: [
    {
      id: 'connect-gmail',
      title: 'Connect your Gmail',
      description: 'Sync your inbox to track brand conversations and opportunities',
      action: {
        text: 'Connect Gmail',
        onClick: () => window.location.href = '/settings/integrations',
      },
    },
    {
      id: 'add-creators',
      title: 'Add creators to your network',
      description: 'Import or manually add creators you want to work with',
      action: {
        text: 'Add Creators',
        onClick: () => window.location.href = '/crm/contacts?type=creator',
      },
    },
    {
      id: 'create-campaign',
      title: 'Launch your first campaign',
      description: 'Start working with creators by creating a campaign',
      action: {
        text: 'Create Campaign',
        onClick: () => window.location.href = '/campaigns/new',
      },
    },
  ],
  
  creator: [
    {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Add your social media accounts and portfolio',
      action: {
        text: 'Edit Profile',
        onClick: () => window.location.href = '/profile',
      },
    },
    {
      id: 'view-opportunities',
      title: 'Browse opportunities',
      description: 'Check out available brand partnerships',
      action: {
        text: 'View Opportunities',
        onClick: () => window.location.href = '/opportunities',
      },
    },
    {
      id: 'connect-payment',
      title: 'Set up payments',
      description: 'Add your payment info to receive campaign payouts',
      action: {
        text: 'Payment Settings',
        onClick: () => window.location.href = '/settings/payments',
      },
    },
  ],
  
  admin: [
    {
      id: 'approve-users',
      title: 'Review pending users',
      description: 'Approve or reject new user registrations',
      action: {
        text: 'Review Users',
        onClick: () => window.location.href = '/admin/users?status=pending',
      },
    },
    {
      id: 'check-health',
      title: 'Check platform health',
      description: 'Review system status and monitoring',
      action: {
        text: 'View Health',
        onClick: () => window.location.href = '/health/detailed',
      },
    },
    {
      id: 'configure-settings',
      title: 'Configure platform settings',
      description: 'Set up integrations and feature flags',
      action: {
        text: 'Settings',
        onClick: () => window.location.href = '/admin/settings',
      },
    },
  ],
};

export default {
  OnboardingChecklist,
  FeatureAnnouncement,
  QuickTip,
  FirstVisitBanner,
  useOnboarding,
  DEFAULT_ONBOARDING_STEPS,
};

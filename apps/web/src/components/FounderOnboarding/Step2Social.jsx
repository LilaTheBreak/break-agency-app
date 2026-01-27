import React, { useState } from 'react';

const FounderOnboardingStep2 = ({ data, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    isActiveOnSocials: data?.isActiveOnSocials || false,
    primaryPlatforms: data?.primaryPlatforms || [],
    currentReach: data?.currentReach || {},
    socialBlocker: data?.socialBlocker || '',
  });

  const platforms = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube'];
  const blockerOptions = [
    "Don't know what to post",
    'No time',
    "Don't know how to position myself",
    'Inconsistent results',
    'Overwhelmed by platforms',
    'Other (describe below)',
  ];

  const handlePlatformToggle = (platform) => {
    const key = platform.toLowerCase();
    setFormData((prev) => ({
      ...prev,
      primaryPlatforms: prev.primaryPlatforms.includes(key)
        ? prev.primaryPlatforms.filter((p) => p !== key)
        : [...prev.primaryPlatforms, key],
    }));
  };

  const handleReachChange = (platform, value) => {
    const key = platform.toLowerCase();
    setFormData((prev) => ({
      ...prev,
      currentReach: {
        ...prev.currentReach,
        [key]: value ? parseInt(value, 10) : undefined,
      },
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
          <h2 className="text-2xl font-semibold text-gray-900">
            Your Social Presence
          </h2>
          <p className="text-gray-600">
            Are you currently active on social media as the founder?
          </p>
        </div>

        {/* Active on socials toggle */}
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="active"
              checked={formData.isActiveOnSocials === true}
              onChange={() =>
                setFormData({ ...formData, isActiveOnSocials: true })
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
            />
            <div className="ml-3">
              <p className="text-lg font-medium text-gray-900">Yes, I'm active</p>
              <p className="text-sm text-gray-600">Posting consistently</p>
            </div>
          </label>
        </div>

        {/* Platforms selection (if active) */}
        {formData.isActiveOnSocials && (
          <div className="space-y-4">
            <p className="font-medium text-gray-900">Which platforms?</p>
            <div className="space-y-2">
              {platforms.map((platform) => (
                <label key={platform} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.primaryPlatforms.includes(platform.toLowerCase())}
                    onChange={() => handlePlatformToggle(platform)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="ml-3 text-gray-900">{platform}</span>
                  {formData.primaryPlatforms.includes(platform.toLowerCase()) && (
                    <input
                      type="number"
                      placeholder="Followers (optional)"
                      value={formData.currentReach[platform.toLowerCase()] || ''}
                      onChange={(e) => handleReachChange(platform, e.target.value)}
                      className="ml-auto px-2 py-1 w-32 border border-gray-300 rounded text-sm"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Not active on socials */}
        {formData.isActiveOnSocials === false && (
          <div className="space-y-4">
            <p className="font-medium text-gray-900">What's stopping you?</p>
            <div className="space-y-2">
              {blockerOptions.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="blocker"
                    value={option}
                    checked={formData.socialBlocker === option}
                    onChange={(e) =>
                      setFormData({ ...formData, socialBlocker: e.target.value })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="ml-3 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
            {formData.socialBlocker === 'Other (describe below)' && (
              <textarea
                placeholder="Tell us more..."
                value={formData.socialBlocker}
                onChange={(e) =>
                  setFormData({ ...formData, socialBlocker: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
              />
            )}
          </div>
        )}

        {/* Not active radio option */}
        <div className="border-2 border-gray-200 rounded-lg p-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="active"
              checked={formData.isActiveOnSocials === false}
              onChange={() =>
                setFormData({ ...formData, isActiveOnSocials: false })
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600"
            />
            <div className="ml-3">
              <p className="text-lg font-medium text-gray-900">No, not yet</p>
              <p className="text-sm text-gray-600">Building and planning</p>
            </div>
          </label>
        </div>

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

export default FounderOnboardingStep2;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BrandFeedback {
  feedbackType: 'APPROVAL' | 'REJECTION' | 'CONCERN' | 'PREFERENCE';
  content: string;
  relatedShortlistId?: string;
  signals?: string[];
}

/**
 * BrandFeedbackForm - PART 3
 * 
 * Allows brand users to submit feedback/concerns about:
 * - Campaign approvals/rejections
 * - Specific creator concerns
 * - General preferences for future campaigns
 * 
 * Signals are collected for AI learning:
 * - audience_mismatch, budget_constraint, brand_safety_risk, etc.
 */
export const BrandFeedbackForm: React.FC<{
  campaignId: string;
  onSuccess?: () => void;
  defaultType?: BrandFeedback['feedbackType'];
}> = ({ campaignId, onSuccess, defaultType = 'CONCERN' }) => {
  const [feedbackType, setFeedbackType] = useState<BrandFeedback['feedbackType']>(defaultType);
  const [content, setContent] = useState('');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [relatedShortlistId, setRelatedShortlistId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const availableSignals = [
    { id: 'audience_mismatch', label: 'Audience Mismatch', category: 'Audience' },
    { id: 'budget_constraint', label: 'Budget Constraint', category: 'Budget' },
    { id: 'brand_safety_risk', label: 'Brand Safety Concern', category: 'Safety' },
    { id: 'content_quality', label: 'Content Quality', category: 'Quality' },
    { id: 'engagement_potential', label: 'High Engagement Potential', category: 'Positive' },
    { id: 'excellent_brand_fit', label: 'Excellent Brand Fit', category: 'Positive' },
    { id: 'regional_reach', label: 'Regional Reach', category: 'Reach' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `/api/brand/feedback/${campaignId}/feedback`,
        {
          feedbackType,
          content,
          relatedShortlistId: relatedShortlistId || undefined,
          signals: selectedSignals
        }
      );

      setSuccess(true);
      setContent('');
      setSelectedSignals([]);
      setRelatedShortlistId('');

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const toggleSignal = (signalId: string) => {
    setSelectedSignals(prev =>
      prev.includes(signalId)
        ? prev.filter(s => s !== signalId)
        : [...prev, signalId]
    );
  };

  const feedbackDescriptions = {
    APPROVAL: 'Confirm approval of a creator for the campaign',
    REJECTION: 'Reject a creator with feedback on why',
    CONCERN: 'Raise concerns or ask for alternatives',
    PREFERENCE: 'Share preferences for future campaigns'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Feedback</h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✓ Feedback submitted successfully
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Feedback Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['APPROVAL', 'REJECTION', 'CONCERN', 'PREFERENCE'] as const).map(type => (
              <label key={type} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                style={{
                  borderColor: feedbackType === type ? '#3b82f6' : '#e5e7eb',
                  backgroundColor: feedbackType === type ? '#eff6ff' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="feedbackType"
                  value={type}
                  checked={feedbackType === type}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="mr-2"
                />
                <div>
                  <div className="text-sm font-medium">{type}</div>
                  <div className="text-xs text-gray-500">{feedbackDescriptions[type]}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Related Creator (optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related to Specific Creator (optional)
          </label>
          <input
            type="text"
            placeholder="Creator/Shortlist ID"
            value={relatedShortlistId}
            onChange={(e) => setRelatedShortlistId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Feedback Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Feedback
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell us your thoughts, concerns, or preferences..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* AI Learning Signals */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tag relevant signals (helps our AI learn)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableSignals.map(signal => (
              <label key={signal.id} className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedSignals.includes(signal.id)}
                  onChange={() => toggleSignal(signal.id)}
                  className="mr-2"
                />
                <div>
                  <div className="text-sm font-medium">{signal.label}</div>
                  <div className="text-xs text-gray-500">{signal.category}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !content}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default BrandFeedbackForm;

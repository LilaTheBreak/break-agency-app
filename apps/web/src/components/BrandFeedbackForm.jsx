import React, { useState } from 'react';

const FEEDBACK_SIGNALS = [
  { value: 'approved_by_brand', label: '✓ Approved by brand' },
  { value: 'good_fit', label: '🎯 Good fit for audience' },
  { value: 'audience_mismatch', label: '⚠️ Audience mismatch' },
  { value: 'budget_constraint', label: '💰 Budget constraint' },
  { value: 'creator_unavailable', label: '⏰ Creator unavailable' },
  { value: 'revision_requested', label: '↻ Revision requested' },
  { value: 'content_fit', label: '✨ Content fits brand' },
  { value: 'engagement_potential', label: '📈 High engagement potential' }
];

interface BrandFeedbackFormProps {
  campaignId: string;
  onSubmit: (feedback: { feedbackType: string; content: string; signals: string[] }) => Promise<void>;
  isLoading?: boolean;
}

export function BrandFeedbackForm({
  campaignId,
  onSubmit,
  isLoading = false
}: BrandFeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<string>('PREFERENCE');
  const [content, setContent] = useState('');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleToggleSignal = (signal: string) => {
    setSelectedSignals(prev =>
      prev.includes(signal)
        ? prev.filter(s => s !== signal)
        : [...prev, signal]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('Please enter your feedback');
      return;
    }

    setSubmitLoading(true);
    try {
      await onSubmit({
        feedbackType,
        content: content.trim(),
        signals: selectedSignals
      });
      setContent('');
      setSelectedSignals([]);
      setFeedbackType('PREFERENCE');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Campaign Feedback</h3>
        <span className="text-xs text-gray-500">Help us improve recommendations</span>
      </div>

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded hover:bg-blue-100 disabled:opacity-50 transition"
        >
          Share Your Feedback
        </button>
      ) : (
        <div className="space-y-3">
          {/* Feedback Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Type of Feedback
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              disabled={submitLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="APPROVAL">Approval / Good Fit</option>
              <option value="REJECTION">Rejection / Poor Fit</option>
              <option value="CONCERN">Concerns / Issues</option>
              <option value="PREFERENCE">General Preference</option>
            </select>
          </div>

          {/* Feedback Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Your Feedback *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us what you think. What worked well? What could improve? Any specific concerns?"
              disabled={submitLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-500">
              {content.length} / 500 characters
            </p>
          </div>

          {/* Learning Signals */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_SIGNALS.map(signal => (
                <button
                  key={signal.value}
                  onClick={() => handleToggleSignal(signal.value)}
                  disabled={submitLoading}
                  className={`px-2 py-1 text-xs rounded font-medium transition ${
                    selectedSignals.includes(signal.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                  } disabled:opacity-50`}
                >
                  {signal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitLoading || !content.trim()}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitLoading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => {
                setIsExpanded(false);
                setContent('');
                setSelectedSignals([]);
              }}
              disabled={submitLoading}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

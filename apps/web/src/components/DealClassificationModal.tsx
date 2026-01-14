import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { ErrorBoundary } from './ErrorBoundary';

interface RevenueTags {
  RECURRING: boolean;
  ONE_OFF: boolean;
  FOUNDER_DEPENDENT: boolean;
  SCALABLE: boolean;
  CREATOR_OWNED: boolean;
}

interface RevenueClassification {
  id: string;
  dealId: string;
  tags: RevenueTags;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresApproval: boolean;
  notes: string;
  validatedAt: string | null;
}

interface DealData {
  id: string;
  name: string;
  value: number;
  type: string;
  status: string;
}

interface AutoClassificationSuggestion {
  suggestedTags: RevenueTags;
  confidence: number;
  reasoning: string;
}

interface Props {
  dealId: string;
  dealData?: DealData;
  isOpen: boolean;
  onClose: () => void;
  onClassified: (classification: RevenueClassification) => void;
  onApprovalRequired?: (dealId: string, riskLevel: string) => void;
}

const REVENUE_TAG_DESCRIPTIONS: Record<keyof RevenueTags, { label: string; description: string; icon: string }> = {
  RECURRING: {
    label: 'Recurring Revenue',
    description: 'Auto-renewing or subscription-based',
    icon: '🔄',
  },
  ONE_OFF: {
    label: 'One-Off Deal',
    description: 'Single transaction, no recurring component',
    icon: '📌',
  },
  FOUNDER_DEPENDENT: {
    label: 'Founder Dependent',
    description: 'Revenue depends on founder involvement',
    icon: '⚠️',
  },
  SCALABLE: {
    label: 'Scalable',
    description: 'Can grow without proportional effort increase',
    icon: '📈',
  },
  CREATOR_OWNED: {
    label: 'Creator-Owned IP',
    description: 'Creator owns the asset/IP being sold',
    icon: '✓',
  },
};

const DealClassificationModal: React.FC<Props> = ({
  dealId,
  dealData,
  isOpen,
  onClose,
  onClassified,
  onApprovalRequired,
}) => {
  const [tags, setTags] = useState<RevenueTags>({
    RECURRING: false,
    ONE_OFF: false,
    FOUNDER_DEPENDENT: false,
    SCALABLE: false,
    CREATOR_OWNED: false,
  });

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AutoClassificationSuggestion | null>(null);
  const [showingSuggestion, setShowingSuggestion] = useState(false);
  const [classification, setClassification] = useState<RevenueClassification | null>(null);

  // Fetch existing classification on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchClassification = async () => {
      try {
        const response = await fetch(`/api/revenue-classification/${dealId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setClassification(data);
          setTags(data.tags);
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Failed to fetch classification:', err);
      }
    };

    fetchClassification();
  }, [dealId, isOpen]);

  // Get auto-classification suggestion
  const handleAutoClassify = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/revenue-classification/${dealId}/auto-classify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get auto-classification');
      }

      const data = await response.json();
      setSuggestion(data);
      setShowingSuggestion(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-classify');
    } finally {
      setLoading(false);
    }
  };

  // Accept suggestion
  const handleAcceptSuggestion = () => {
    if (suggestion) {
      setTags(suggestion.suggestedTags);
      setShowingSuggestion(false);
    }
  };

  // Calculate risk level based on tags
  const calculateRiskLevel = (): 'LOW' | 'MEDIUM' | 'HIGH' => {
    const riskFactors = {
      ONE_OFF: tags.ONE_OFF ? 1 : 0, // One-off is risky
      FOUNDER_DEPENDENT: tags.FOUNDER_DEPENDENT ? 1 : 0, // Founder dependency is risky
      NOT_SCALABLE: !tags.SCALABLE && tags.RECURRING ? 1 : 0, // Non-scalable recurring is medium risk
      NOT_OWNED: !tags.CREATOR_OWNED ? 0.5 : 0, // Creator not owning IP is medium risk
    };

    const totalRisk = Object.values(riskFactors).reduce((a, b) => a + b, 0);

    if (totalRisk >= 2) return 'HIGH';
    if (totalRisk >= 1) return 'MEDIUM';
    return 'LOW';
  };

  // Get risk warnings
  const getRiskWarnings = (): string[] => {
    const warnings: string[] = [];

    if (tags.ONE_OFF && tags.RECURRING) {
      warnings.push('Deal marked as both one-off and recurring - please clarify');
    }

    if (tags.RECURRING && tags.FOUNDER_DEPENDENT) {
      warnings.push('⚠️ Founder-dependent recurring revenue is unsustainable long-term and impacts valuation significantly');
    }

    if (tags.ONE_OFF && !tags.SCALABLE) {
      warnings.push('One-off, non-scalable deals have limited impact on business valuation');
    }

    if (!tags.CREATOR_OWNED && !tags.SCALABLE) {
      warnings.push('This deal lacks ownership and scalability - it may not represent building lasting business value');
    }

    if (!tags.CREATOR_OWNED && tags.RECURRING) {
      warnings.push('Creator does not own the asset - consider whether this is a sustainable revenue source');
    }

    return warnings;
  };

  // Validate classification
  const validateClassification = async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/revenue-classification/${dealId}/validate`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message || 'Classification validation failed');
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation error');
      return false;
    }
  };

  // Save classification
  const handleSaveClassification = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate first
      const isValid = await validateClassification();
      if (!isValid) return;

      const riskLevel = calculateRiskLevel();
      const requiresApproval = riskLevel === 'HIGH';

      const payload = {
        tags,
        notes,
        riskLevel,
      };

      const response = await fetch(`/api/revenue-classification/${dealId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save classification');
      }

      const savedClassification = await response.json();

      // If high risk, trigger approval workflow
      if (requiresApproval && onApprovalRequired) {
        onApprovalRequired(dealId, riskLevel);
      }

      onClassified(savedClassification);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save classification');
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = calculateRiskLevel();
  const warnings = getRiskWarnings();
  const isAtLeastOneTagSelected = Object.values(tags).some((t) => t);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Classify Revenue Deal"
      size="lg"
    >
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Deal Info */}
          {dealData && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900">{dealData.name}</h4>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>${dealData.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                <span>{dealData.type}</span>
                <span className="capitalize">{dealData.status}</span>
              </div>
            </div>
          )}

          {/* Auto-Classify Option */}
          <div className="flex gap-2">
            <button
              onClick={handleAutoClassify}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              💡 Auto-Classify
            </button>
            <p className="text-xs text-gray-500 self-center">
              AI will suggest tags based on deal data
            </p>
          </div>

          {/* Auto-Classification Suggestion */}
          {showingSuggestion && suggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-blue-900">Suggested Classification</h4>
                <p className="text-sm text-blue-700">
                  Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                </p>
              </div>

              <p className="text-sm text-blue-800">{suggestion.reasoning}</p>

              <div className="flex gap-2">
                <button
                  onClick={handleAcceptSuggestion}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Accept Suggestion
                </button>
                <button
                  onClick={() => setShowingSuggestion(false)}
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Revenue Tag Selector */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Select Revenue Tags</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.entries(REVENUE_TAG_DESCRIPTIONS) as Array<[keyof RevenueTags, any]>).map(
                ([tagKey, tagInfo]) => (
                  <label
                    key={tagKey}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition ${
                      tags[tagKey]
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tags[tagKey]}
                      onChange={(e) =>
                        setTags({
                          ...tags,
                          [tagKey]: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <div className="ml-4 -mt-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {tagInfo.icon} {tagInfo.label}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{tagInfo.description}</p>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Risk Level Indicator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-gray-900">Risk Assessment</label>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-sm ${
                  riskLevel === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : riskLevel === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {riskLevel} RISK
              </span>
            </div>
            {riskLevel === 'HIGH' && (
              <p className="text-sm text-red-700 p-2 bg-red-50 rounded">
                ⚠️ This deal will require manager approval before closing.
              </p>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">⚠️ Warnings</h4>
              <ul className="space-y-1 text-sm text-orange-800">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classification Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context or reasoning for this classification..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Validation Checklist */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Validation Checklist</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={isAtLeastOneTagSelected ? '✓' : '○'}>
                  {isAtLeastOneTagSelected ? '✓' : '○'}
                </span>
                <span className="text-gray-700">At least one tag selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={!tags.ONE_OFF || tags.RECURRING ? '✓' : '○'}>
                  {!tags.ONE_OFF || tags.RECURRING ? '✓' : '○'}
                </span>
                <span className="text-gray-700">
                  Not marked as both one-off and recurring
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={!tags.RECURRING || !tags.ONE_OFF ? '✓' : '○'}>
                  {!tags.RECURRING || !tags.ONE_OFF ? '✓' : '○'}
                </span>
                <span className="text-gray-700">
                  Recurring revenue type is clear
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClassification}
              disabled={loading || !isAtLeastOneTagSelected}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : riskLevel === 'HIGH' ? `Save & Request Approval` : 'Save Classification'}
            </button>
          </div>
        </div>
      </ErrorBoundary>
    </Modal>
  );
};

export default DealClassificationModal;

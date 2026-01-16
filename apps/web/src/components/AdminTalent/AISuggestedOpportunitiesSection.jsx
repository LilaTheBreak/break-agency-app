import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AISuggestedOpportunityCard } from './AISuggestedOpportunityCard.jsx';
import { apiFetch } from '../../services/apiClient.js';

/**
 * AISuggestedOpportunitiesSection
 * 
 * Shows AI-generated brand collaboration suggestions for EXCLUSIVE talent.
 * Only visible when:
 * - Talent has representationType = "EXCLUSIVE"
 * - Talent has connected social profiles
 * 
 * Features:
 * - Displays 5-8 tailored suggestions
 * - Each with confidence score, rationale, and signals
 * - Create Opportunity, Save, Dismiss actions
 * - Generate/refresh suggestions on demand
 * - Empty state messaging
 */
export function AISuggestedOpportunitiesSection({
  talentId,
  talentName,
  isExclusive
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load existing suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, [talentId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/talent/${talentId}/ai-suggestions`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        console.error('Error fetching suggestions:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setGenerating(true);
      const response = await apiFetch(`/api/admin/talent/${talentId}/ai-suggestions`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setHasGenerated(true);
        toast.success(`Generated ${data.count || 0} suggestions`);
        
        if (data.count === 0) {
          toast.error(data.message || 'No suggestions available. Check social profiles.');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateOpportunity = async (suggestionId) => {
    try {
      const response = await apiFetch(
        `/api/admin/talent/${talentId}/ai-suggestions/${suggestionId}/convert`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Opportunity created! Set the value in the detail view.');
        
        // Update local state
        setSuggestions(prev =>
          prev.map(s =>
            s.id === suggestionId
              ? { ...s, status: 'converted', convertedOpportunityId: data.opportunity?.id }
              : s
          )
        );
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to create opportunity');
    }
  };

  const handleSaveSuggestion = async (suggestionId) => {
    try {
      const response = await apiFetch(
        `/api/admin/talent/${talentId}/ai-suggestions/${suggestionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'saved' }),
        }
      );

      if (response.ok) {
        toast.success('Suggestion saved for later');
        
        // Update local state
        setSuggestions(prev =>
          prev.map(s => (s.id === suggestionId ? { ...s, status: 'saved' } : s))
        );
      } else {
        toast.error('Failed to save suggestion');
      }
    } catch (error) {
      console.error('Error saving suggestion:', error);
      toast.error('Failed to save suggestion');
    }
  };

  const handleDismissSuggestion = async (suggestionId) => {
    try {
      const response = await apiFetch(
        `/api/admin/talent/${talentId}/ai-suggestions/${suggestionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'dismissed' }),
        }
      );

      if (response.ok) {
        toast.success('Suggestion dismissed');
        
        // Remove from local state
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      } else {
        toast.error('Failed to dismiss suggestion');
      }
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      toast.error('Failed to dismiss suggestion');
    }
  };

  // Filter out dismissed suggestions for display
  const activeSuggestions = suggestions.filter(s => s.status !== 'dismissed');

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              AI-Suggested Opportunities
            </p>
          </div>
          <p className="text-sm text-brand-black/60">
            Tailored brand collaboration opportunities based on {talentName}'s social profile
          </p>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerateSuggestions}
          disabled={generating || loading}
          className="flex items-center gap-2 rounded-lg bg-purple-600 text-white font-semibold text-sm px-4 py-2 hover:bg-purple-700 disabled:opacity-50 transition whitespace-nowrap"
        >
          {generating ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {suggestions.length > 0 ? 'Refresh' : 'Generate'}
            </>
          )}
        </button>
      </div>

      {/* Empty state - not generated yet */}
      {!hasGenerated && activeSuggestions.length === 0 && !generating && (
        <div className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-black/2 p-8 text-center">
          <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
          <h4 className="font-semibold text-brand-black mb-2">Ready for AI Analysis</h4>
          <p className="text-sm text-brand-black/60 mb-4">
            Click "Generate" to let AI analyze {talentName}'s social profiles and suggest perfect brand collaborations.
          </p>
          <button
            onClick={handleGenerateSuggestions}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white font-semibold text-sm px-6 py-2 hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <Sparkles className="h-4 w-4" />
            Generate Suggestions
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <Loader className="h-8 w-8 animate-spin text-brand-red mx-auto" />
          <p className="text-sm text-brand-black/60 mt-2">Loading suggestions...</p>
        </div>
      )}

      {/* Suggestions list */}
      {!loading && activeSuggestions.length > 0 && (
        <div className="space-y-3">
          {activeSuggestions.map(suggestion => (
            <AISuggestedOpportunityCard
              key={suggestion.id}
              suggestion={suggestion}
              onCreateOpportunity={handleCreateOpportunity}
              onSave={handleSaveSuggestion}
              onDismiss={handleDismissSuggestion}
              isLoading={false}
            />
          ))}

          {/* Info text */}
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-900">
              <strong>💡 Tip:</strong> AI suggestions are decision support tools. No outreach or opportunities will be created automatically. You always have full control.
            </p>
          </div>
        </div>
      )}

      {/* Empty state - all dismissed or none generated */}
      {!loading && !generating && hasGenerated && activeSuggestions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-black/2 p-8 text-center">
          <Sparkles className="h-12 w-12 text-brand-black/20 mx-auto mb-4" />
          <h4 className="font-semibold text-brand-black mb-2">All suggestions reviewed</h4>
          <p className="text-sm text-brand-black/60 mb-4">
            Generate fresh suggestions to see new opportunities.
          </p>
          <button
            onClick={handleGenerateSuggestions}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-black/20 text-brand-black font-semibold text-sm px-6 py-2 hover:bg-brand-black/5 disabled:opacity-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Generate New Suggestions
          </button>
        </div>
      )}

      {/* Error state - insufficient data */}
      {!loading && !generating && hasGenerated && activeSuggestions.length === 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-900">
            <strong>⚠️ AI could not generate suggestions.</strong> Make sure {talentName} has connected social profiles with follower data and content information.
          </p>
        </div>
      )}
    </section>
  );
}

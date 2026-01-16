import React from 'react';
import { Sparkles, ChevronDown, ChevronUp, Check, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * AISuggestedOpportunityCard - Single AI suggestion card
 * 
 * Shows:
 * - Brand name with AI badge
 * - Vertical/industry
 * - Confidence score visualization
 * - AI rationale (1-2 sentences)
 * - Detected signals as chips
 * - Suggested collaboration type
 * - Action buttons (Create, Save, Dismiss)
 */
export function AISuggestedOpportunityCard({
  suggestion,
  onCreateOpportunity,
  onSave,
  onDismiss,
  isLoading = false
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!suggestion) return null;

  // Confidence score styling
  const getConfidenceColor = (score) => {
    if (score === "high") return "bg-green-100 text-green-700 border-green-300";
    if (score === "medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-blue-100 text-blue-700 border-blue-300";
  };

  // Collaboration type label
  const getCollabTypeLabel = (type) => {
    const labels = {
      paid_post: "Paid Post",
      ambassador: "Ambassador",
      event: "Event",
      product_launch: "Product Launch",
      long_term_partnership: "Long-term Partnership"
    };
    return labels[type] || type;
  };

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-gradient-to-br from-brand-white via-brand-white to-blue-50/30 overflow-hidden transition-all hover:border-brand-black/20">
      {/* Header - always visible */}
      <div className="p-4 cursor-pointer hover:bg-brand-black/2" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <h4 className="font-semibold text-brand-black">{suggestion.brandName}</h4>
              <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                AI Suggested
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-brand-black/60">{suggestion.vertical}</span>
              <div className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${getConfidenceColor(suggestion.confidenceScore)}`}>
                {suggestion.confidenceScore.charAt(0).toUpperCase() + suggestion.confidenceScore.slice(1)} Confidence
              </div>
            </div>

            <p className="text-sm text-brand-black/70 line-clamp-2">{suggestion.rationale}</p>
          </div>

          {/* Expand/Collapse toggle */}
          <button className="ml-2 p-1 hover:bg-brand-black/5 rounded-lg transition">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-brand-black/60" />
            ) : (
              <ChevronDown className="h-5 w-5 text-brand-black/60" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-brand-black/10 p-4 space-y-4">
          {/* Suggested collaboration type */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-red font-semibold mb-2">
              Suggested Collaboration
            </p>
            <p className="text-sm font-semibold text-brand-black">
              {getCollabTypeLabel(suggestion.suggestedCollabType)}
            </p>
          </div>

          {/* Detected signals */}
          {suggestion.detectedSignals && suggestion.detectedSignals.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-red font-semibold mb-2">
                Why This Match
              </p>
              <div className="space-y-2">
                {suggestion.detectedSignals.map((signal, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-red mt-2 flex-shrink-0" />
                    <p className="text-sm text-brand-black/80">{signal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full rationale */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-red font-semibold mb-2">
              Rationale
            </p>
            <p className="text-sm text-brand-black/80 leading-relaxed">{suggestion.rationale}</p>
          </div>

          {/* Status indicator */}
          {suggestion.status && suggestion.status !== "suggested" && (
            <div className="rounded-lg bg-brand-black/5 p-2">
              <p className="text-xs text-brand-black/60">
                Status: <span className="font-semibold capitalize">{suggestion.status}</span>
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => onCreateOpportunity(suggestion.id)}
              disabled={isLoading}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-lg bg-brand-red text-white font-semibold text-sm py-2 hover:bg-brand-red/90 disabled:opacity-50 transition"
            >
              <Check className="h-4 w-4" />
              Create Opportunity
            </button>

            <button
              onClick={() => onSave(suggestion.id)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-brand-black/20 text-brand-black font-semibold text-sm px-4 py-2 hover:bg-brand-black/5 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              Save
            </button>

            <button
              onClick={() => onDismiss(suggestion.id)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-brand-black/20 text-brand-black font-semibold text-sm px-4 py-2 hover:bg-brand-black/5 disabled:opacity-50 transition"
            >
              <X className="h-4 w-4" />
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

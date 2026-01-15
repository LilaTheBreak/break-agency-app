import React, { useMemo, useState } from "react";
import { Tag, TrendingUp, TrendingDown, Zap, HelpCircle } from "lucide-react";

/**
 * Metric Tooltip component
 */
function MetricTooltip({ explanation, status }) {
  const [show, setShow] = useState(false);
  
  if (!explanation) return null;
  
  return (
    <div className="relative inline-block">
      <HelpCircle 
        className="h-3 w-3 text-brand-black/20 cursor-help hover:text-brand-black/40"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-0 mb-2 w-40 bg-brand-black rounded-lg p-2 text-white text-xs z-50">
          <p>{explanation}</p>
          <div className="absolute top-full left-2 w-2 h-2 bg-brand-black transform rotate-45 -mt-1"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to extract metric value and metadata
 */
function getMetricValue(metric) {
  if (!metric) return { display: "—", status: "unavailable", explanation: "", source: "" };
  if (typeof metric === "object" && "value" in metric) {
    // New standardized format
    const { value, status, explanation, source } = metric;
    let display = "—";
    if (value !== null && value !== undefined && value !== 0) {
      if (typeof value === "number") {
        display = value.toString();
      } else {
        display = value;
      }
    }
    return { display, status, explanation, source };
  }
  // Fallback for old format
  return { 
    display: metric || "—",
    status: "unknown",
    explanation: "",
    source: ""
  };
}

/**
 * AnalyticsKeywordsThemes
 * 
 * Shows keyword extraction and theme analysis:
 * - Core themes
 * - Emerging topics
 * - Declining topics
 * - Brand-safe vs risky language
 * - Supports keyword comparison in comparison mode
 */
export default function AnalyticsKeywordsThemes({ data, comparisonData, comparisonProfile }) {
  const keywords = useMemo(() => {
    if (!data || !data.keywords) return { core: [], emerging: [], declining: [] };
    
    return {
      core: data.keywords.filter(k => k.category === "core").slice(0, 5),
      emerging: data.keywords.filter(k => k.category === "emerging").slice(0, 5),
      declining: data.keywords.filter(k => k.category === "declining").slice(0, 5),
    };
  }, [data]);

  const comparisonKeywords = useMemo(() => {
    if (!comparisonData || !comparisonData.keywords) return { core: [], emerging: [], declining: [] };
    
    return {
      core: comparisonData.keywords.filter(k => k.category === "core").slice(0, 5),
      emerging: comparisonData.keywords.filter(k => k.category === "emerging").slice(0, 5),
      declining: comparisonData.keywords.filter(k => k.category === "declining").slice(0, 5),
    };
  }, [comparisonData]);

  const hasData = keywords.core.length > 0 || keywords.emerging.length > 0 || keywords.declining.length > 0;

  if (!hasData) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-6">
        <p className="text-center text-sm text-brand-black/60">No keyword data available</p>
      </section>
    );
  }

  const KeywordSection = ({ title, icon: Icon, keywords, color, compareKeywords }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs uppercase tracking-[0.1em] font-semibold text-brand-black/80">
          {title}
        </p>
      </div>

      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, idx) => {
            const inComparison = compareKeywords?.some(
              ck => ck.term.toLowerCase() === kw.term.toLowerCase()
            );
            
            // Get metric values with new structure handling
            const frequencyMetric = getMetricValue(kw.frequency);
            const sentimentMetric = kw.sentiment ? getMetricValue(kw.sentiment) : null;

            return (
              <div
                key={idx}
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.1em] font-semibold transition ${
                  inComparison
                    ? "border-2 border-brand-red bg-brand-red/5"
                    : "border border-brand-black/10 hover:border-brand-black/20"
                }`}
                title={`${frequencyMetric.display} mentions${inComparison ? " (Also in comparison)" : ""}`}
              >
                {kw.term}
                {frequencyMetric.display !== "—" && (
                  <span className="ml-1.5 font-mono text-[0.65rem]">×{frequencyMetric.display}</span>
                )}
                {sentimentMetric && sentimentMetric.source && (
                  <span className="ml-1.5 text-[0.6rem] opacity-60">
                    [{sentimentMetric.source}]
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-brand-black/50 italic">No data</p>
      )}
    </div>
  );

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-5 w-5 text-brand-red" />
          <h3 className="font-display text-2xl uppercase text-brand-black">Keywords & Themes</h3>
        </div>
        <p className="text-sm text-brand-black/60">
          Topics, signals, and narrative patterns
          {comparisonProfile && <span> vs {comparisonProfile.name}</span>}
        </p>
      </div>

      {!comparisonData ? (
        // Single profile view
        <div className="space-y-6">
          <KeywordSection
            title="Core Themes"
            icon={Zap}
            keywords={keywords.core}
            color="text-brand-red"
          />

          <div className="border-t border-brand-black/10 pt-6">
            <KeywordSection
              title="Emerging Topics"
              icon={TrendingUp}
              keywords={keywords.emerging}
              color="text-green-600"
            />
          </div>

          <div className="border-t border-brand-black/10 pt-6">
            <KeywordSection
              title="Declining Topics"
              icon={TrendingDown}
              keywords={keywords.declining}
              color="text-orange-600"
            />
          </div>
        </div>
      ) : (
        // Comparison view
        <div className="grid gap-6 md:grid-cols-2">
          {/* First profile */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 mb-4">
              Profile 1
            </p>

            <KeywordSection
              title="Core Themes"
              icon={Zap}
              keywords={keywords.core}
              color="text-brand-red"
              compareKeywords={comparisonKeywords.core}
            />

            <div className="border-t border-brand-black/10 pt-4">
              <KeywordSection
                title="Emerging"
                icon={TrendingUp}
                keywords={keywords.emerging}
                color="text-green-600"
                compareKeywords={comparisonKeywords.emerging}
              />
            </div>
          </div>

          {/* Second profile */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-black/60 mb-4">
              Profile 2
            </p>

            <KeywordSection
              title="Core Themes"
              icon={Zap}
              keywords={comparisonKeywords.core}
              color="text-brand-red"
              compareKeywords={keywords.core}
            />

            <div className="border-t border-brand-black/10 pt-4">
              <KeywordSection
                title="Emerging"
                icon={TrendingUp}
                keywords={comparisonKeywords.emerging}
                color="text-green-600"
                compareKeywords={keywords.emerging}
              />
            </div>
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="mt-6 pt-6 border-t border-brand-black/10 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs uppercase tracking-[0.1em] font-semibold text-blue-900 mb-2">
          Content Signature
        </p>
        <p className="text-sm text-blue-800">
          This creator's core themes define their content identity. Emerging topics show growth areas. Declining topics may indicate changing focus or audience shift.
        </p>
      </div>
    </section>
  );
}

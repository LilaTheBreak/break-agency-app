import React from "react";
import { captureException, setSentryTags } from "../lib/sentry.js";

/**
 * SafeBoundary - Reusable error boundary for components
 * 
 * Wraps components to prevent crashes from propagating.
 * Automatically reports to Sentry with context.
 * 
 * Usage:
 *   <SafeBoundary feature="talent" fallback={<div>Error loading talent</div>}>
 *     <TalentList />
 *   </SafeBoundary>
 */
class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`❌ [SafeBoundary] Error in ${this.props.feature || "component"}:`, error);
    
    this.setState({
      error,
      errorInfo,
    });

    // Tag error with feature context
    if (this.props.feature) {
      setSentryTags({
        feature: this.props.feature,
        errorBoundary: "SafeBoundary",
      });
    }

    // Report to Sentry
    captureException(error, {
      ...errorInfo,
      feature: this.props.feature || "unknown",
      errorBoundary: "SafeBoundary",
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-red mb-1">
                Error Loading {this.props.feature || "Component"}
              </p>
              <p className="text-xs text-brand-black/60 mb-2">
                This section encountered an error and couldn't load properly.
              </p>
              <button
                onClick={this.handleReset}
                className="text-xs text-brand-red hover:text-brand-black transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeBoundary;


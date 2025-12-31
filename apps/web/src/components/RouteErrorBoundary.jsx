import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { captureException, setSentryTags } from "../lib/sentry.js";

/**
 * Route-level error boundary for dashboard pages
 * Allows partial recovery without full page reload
 * Automatically reports to Sentry with route context
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`❌ [RouteErrorBoundary] Error in ${this.props.routeName}:`, error);
    console.error("Error details:", errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Tag error with route information
    setSentryTags({
      route: this.props.routeName,
      errorBoundary: "RouteErrorBoundary",
    });

    // Report to Sentry with route context
    captureException(error, {
      ...errorInfo,
      route: this.props.routeName,
      errorBoundary: "RouteErrorBoundary",
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-xl w-full">
            <div className="rounded-2xl border border-brand-red/20 bg-brand-white/80 backdrop-blur-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-brand-black mb-1">
                    Error Loading Page
                  </h2>
                  <p className="text-sm text-brand-black/60 mb-3">
                    {this.props.routeName ? `The ${this.props.routeName} page` : "This page"} encountered an error and couldn't load properly.
                  </p>

                  {this.state.error && (
                    <div className="rounded-lg bg-brand-red/5 border border-brand-red/10 p-3 mb-4">
                      <p className="text-xs font-mono text-brand-red">
                        {this.state.error.toString()}
                      </p>
                      {process.env.NODE_ENV === "development" && this.state.errorInfo?.componentStack && (
                        <details className="mt-2">
                          <summary className="text-xs text-brand-black/50 cursor-pointer hover:text-brand-black">
                            Component stack
                          </summary>
                          <pre className="text-[10px] text-brand-black/50 mt-2 overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={this.handleRetry}
                      className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-red transition"
                    >
                      Try Again
                    </button>
                    {this.props.onNavigateBack && (
                      <button
                        onClick={this.props.onNavigateBack}
                        className="rounded-full border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition"
                      >
                        Go Back
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook wrapper for functional components
 */
export function RouteErrorBoundaryWrapper({ routeName, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <RouteErrorBoundary
      key={location.pathname} // Reset boundary on route change
      routeName={routeName}
      onNavigateBack={handleNavigateBack}
    >
      {children}
    </RouteErrorBoundary>
  );
}

export default RouteErrorBoundary;

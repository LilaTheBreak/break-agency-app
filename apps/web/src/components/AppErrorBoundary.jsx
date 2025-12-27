import React from "react";

/**
 * Root-level error boundary that catches all React errors
 * Displays a full-page error state with recovery options
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ [AppErrorBoundary] Caught error:", error);
    console.error("Error details:", errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external service if configured
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Force page reload to ensure clean state
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-linen px-6">
          <div className="max-w-2xl w-full">
            <div className="rounded-3xl border border-brand-red/20 bg-brand-white p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-brand-black mb-2">
                    Something Went Wrong
                  </h1>
                  <p className="text-brand-black/70 mb-4">
                    The application encountered an unexpected error. This has been logged for review.
                  </p>
                  
                  {this.state.error && (
                    <div className="rounded-xl bg-brand-red/5 border border-brand-red/20 p-4 mb-4">
                      <p className="text-xs font-mono text-brand-red mb-2">
                        <strong>Error:</strong> {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo?.componentStack && (
                        <details className="mt-2">
                          <summary className="text-xs text-brand-black/60 cursor-pointer hover:text-brand-black">
                            View technical details
                          </summary>
                          <pre className="text-[10px] text-brand-black/60 mt-2 overflow-auto max-h-40">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={this.handleReset}
                      className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-red transition"
                    >
                      Return to Home
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition"
                    >
                      Reload Page
                    </button>
                  </div>

                  {this.state.errorCount > 1 && (
                    <p className="text-xs text-brand-red mt-4">
                      ⚠️ This error has occurred {this.state.errorCount} times. Please contact support if the issue persists.
                    </p>
                  )}
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

export default AppErrorBoundary;

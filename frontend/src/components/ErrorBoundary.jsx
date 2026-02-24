/**
 * ErrorBoundary.jsx — Catches React render errors
 * -------------------------------------------------
 * Wraps the app to prevent white-screen crashes.
 * Shows a user-friendly fallback with a reload button.
 */
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console only — no external service configured
    console.warn('[ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-neutral-900">Something went wrong</h1>
            <p className="text-neutral-600 text-sm">
              An unexpected error occurred. Please reload the page.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre className="mt-4 max-h-40 overflow-auto rounded bg-neutral-100 p-3 text-left text-xs text-red-700">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="mt-4 inline-block rounded bg-primary-800 px-6 py-2 text-sm font-medium text-white hover:bg-primary-900 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

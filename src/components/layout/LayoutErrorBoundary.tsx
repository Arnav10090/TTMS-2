import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * LayoutErrorBoundary catches errors in the layout components and displays
 * a fallback UI to prevent the entire application from crashing.
 * 
 * Requirements: Error Handling
 */
export class LayoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('Layout Error Boundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to send this to an error tracking service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    // Reset error state and attempt to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the page to fully reset the application
    window.location.reload();
  };

  handleGoHome = (): void => {
    // Navigate to home page
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <FallbackLayout 
        error={this.state.error}
        onReset={this.handleReset}
        onReload={this.handleReload}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

interface FallbackLayoutProps {
  error: Error | null;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

/**
 * FallbackLayout provides a minimal UI when the main layout fails to render.
 * It includes basic navigation and error recovery options.
 */
const FallbackLayout: React.FC<FallbackLayoutProps> = ({ 
  error, 
  onReset, 
  onReload, 
  onGoHome 
}) => {
  // Check if we're in development mode by checking if the hostname is localhost
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Application Error</h1>
                <p className="text-sm text-red-100">Something went wrong with the layout</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              We encountered an unexpected error while rendering the application layout. 
              This is usually a temporary issue that can be resolved by refreshing the page.
            </p>

            {/* Error Details (Development Only) */}
            {isDevelopment && error && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Error Details (Development Mode)
                </h3>
                <div className="text-xs font-mono text-red-600 dark:text-red-400 space-y-1">
                  <div><strong>Message:</strong> {error.message}</div>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-48 text-slate-600 dark:text-slate-400">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={onReload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                onClick={onGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                If this problem persists, please contact support or check the browser console for more details.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Error occurred at {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

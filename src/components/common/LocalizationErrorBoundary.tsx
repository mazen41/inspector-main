import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Globe } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onLanguageReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType?: 'translation' | 'language_switch' | 'api' | 'unknown';
}

/**
 * Specialized error boundary for localization-related errors
 * Provides specific fallbacks and recovery options for translation failures
 */
class LocalizationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Determine error type based on error message or stack
    let errorType: State['errorType'] = 'unknown';
    
    if (error.message.includes('translation') || error.message.includes('Translation')) {
      errorType = 'translation';
    } else if (error.message.includes('language') || error.message.includes('Language')) {
      errorType = 'language_switch';
    } else if (error.message.includes('API') || error.message.includes('fetch')) {
      errorType = 'api';
    }

    return { 
      hasError: true, 
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LocalizationErrorBoundary caught an error:', error, errorInfo);
    
    // Log specific localization error details
    if (this.state.errorType === 'translation') {
      console.error('Translation loading failed:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorType: undefined });
  };

  handleLanguageReset = () => {
    // Reset to default language and clear error
    this.props.onLanguageReset?.();
    this.setState({ hasError: false, error: undefined, errorType: undefined });
  };

  getErrorMessage(): string {
    switch (this.state.errorType) {
      case 'translation':
        return 'Failed to load translations. Some text may not display correctly.';
      case 'language_switch':
        return 'Failed to switch language. Please try again or reset to default language.';
      case 'api':
        return 'Failed to load language data from server. Please check your connection.';
      default:
        return 'A localization error occurred. The application may not display correctly.';
    }
  }

  getRecoveryActions(): ReactNode {
    const { errorType } = this.state;
    
    return (
      <div className="space-y-3">
        <Button
          onClick={this.handleRetry}
          className="w-full"
          variant="primary"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        
        {(errorType === 'translation' || errorType === 'language_switch') && (
          <Button
            onClick={this.handleLanguageReset}
            className="w-full"
            variant="secondary"
          >
            <Globe className="mr-2 h-4 w-4" />
            Reset to Default Language
          </Button>
        )}
        
        <Button
          onClick={() => window.location.reload()}
          className="w-full"
          variant="outline"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-[200px] flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6 m-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full space-y-6 text-center">
            <div>
              <AlertTriangle 
                className="mx-auto h-12 w-12 text-red-500" 
                aria-hidden="true"
              />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Localization Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {this.getErrorMessage()}
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            
            {this.getRecoveryActions()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LocalizationErrorBoundary;
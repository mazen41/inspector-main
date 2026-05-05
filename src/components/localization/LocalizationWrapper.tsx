import React from 'react';
import { LocalizationProvider } from '../../contexts/LocalizationContext';
import { LocalizationErrorBoundary } from '../common';
import { useLocalizationError } from '../../hooks/useLocalizationError';

interface LocalizationWrapperProps {
  children: React.ReactNode;
}

/**
 * Comprehensive wrapper for the localization system with error handling
 * Provides error boundaries and fallback mechanisms for translation failures
 */
const LocalizationWrapper: React.FC<LocalizationWrapperProps> = ({ children }) => {
  return (
    <LocalizationErrorBoundary
      onError={(error, errorInfo) => {
        // Log comprehensive error information
        console.error('Localization system error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });

        // In production, you might want to send this to an error reporting service
        if (import.meta.env.PROD) {
          // Example: sendErrorToService(error, errorInfo);
        }
      }}
      onLanguageReset={() => {
        // Handle language reset - this will be called from the error boundary
        console.log('Language reset requested from error boundary');
      }}
    >
      <LocalizationProvider>
        <ErrorRecoveryHandler>
          {children}
        </ErrorRecoveryHandler>
      </LocalizationProvider>
    </LocalizationErrorBoundary>
  );
};

/**
 * Internal component to handle error recovery within the localization context
 */
const ErrorRecoveryHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasError, error, resetToDefault } = useLocalizationError();

  // Auto-recovery mechanism for certain types of errors
  React.useEffect(() => {
    if (hasError && error) {
      // Auto-reset for specific error types after a delay
      if (error.includes('Failed to load translations') || error.includes('not found in available languages')) {
        const timer = setTimeout(() => {
          console.log('Auto-recovering from localization error...');
          resetToDefault();
        }, 5000); // 5 second delay for auto-recovery

        return () => clearTimeout(timer);
      }
    }
  }, [hasError, error, resetToDefault]);

  return <>{children}</>;
};

export default LocalizationWrapper;
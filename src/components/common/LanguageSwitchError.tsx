import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, RefreshCw, Globe, X } from 'lucide-react';
import Button from './Button';

interface LanguageSwitchErrorProps {
  error: string;
  targetLanguage?: string;
  onRetry?: () => void;
  onReset?: () => void;
  onDismiss?: () => void;
  className?: string;
  isRTL?: boolean;
}

/**
 * Specialized error component for language switching failures
 * Provides user-friendly error messages and recovery options
 */
const LanguageSwitchError: React.FC<LanguageSwitchErrorProps> = ({
  error,
  targetLanguage,
  onRetry,
  onReset,
  onDismiss,
  className = '',
  isRTL = false
}) => {
  const getUserFriendlyMessage = (error: string): string => {
    if (error.includes('not found in available languages')) {
      return `The selected language${targetLanguage ? ` (${targetLanguage})` : ''} is not available.`;
    }
    
    if (error.includes('Failed to load translations')) {
      return 'Unable to load language files. Please check your internet connection.';
    }
    
    if (error.includes('Failed to change language')) {
      return 'Language switch failed. Please try again.';
    }
    
    if (error.includes('API')) {
      return 'Server error while switching language. Please try again later.';
    }
    
    return 'An error occurred while changing the language.';
  };

  return (
    <div 
      className={clsx(
        'bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={clsx(
        'flex items-start',
        isRTL && 'flex-row-reverse'
      )}>
        <div className="flex-shrink-0">
          <AlertTriangle 
            className="w-5 h-5 text-red-400" 
            aria-hidden="true"
          />
        </div>
        
        <div className={clsx(
          'flex-1',
          isRTL ? 'mr-3' : 'ml-3'
        )}>
          <h3 className={clsx(
            'text-sm font-medium text-red-800',
            isRTL && 'text-right'
          )}>
            Language Switch Failed
          </h3>
          <p className={clsx(
            'mt-1 text-sm text-red-700',
            isRTL && 'text-right'
          )}>
            {getUserFriendlyMessage(error)}
          </p>
          
          {import.meta.env.DEV && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {error}
              </pre>
            </details>
          )}
        </div>
        
        {onDismiss && (
          <div className={clsx(
            'flex-shrink-0',
            isRTL ? 'mr-2' : 'ml-2'
          )}>
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className={clsx(
        'mt-4 flex flex-wrap gap-2',
        isRTL && 'flex-row-reverse'
      )}>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Try Again
          </Button>
        )}
        
        {onReset && (
          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <Globe className="w-3 h-3 mr-1" />
            Reset Language
          </Button>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitchError;
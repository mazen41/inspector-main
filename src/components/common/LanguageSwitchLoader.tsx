import React from 'react';
import clsx from 'clsx';
import { CheckCircle } from 'lucide-react';

interface LanguageSwitchLoaderProps {
  isLoading: boolean;
  isSuccess?: boolean;
  currentLanguage?: string;
  targetLanguage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isRTL?: boolean;
}

/**
 * Loading indicator for language switching operations
 * Shows loading state, success confirmation, and smooth transitions
 */
const LanguageSwitchLoader: React.FC<LanguageSwitchLoaderProps> = ({
  isLoading,
  isSuccess = false,
  targetLanguage,
  className = '',
  size = 'md',
  showText = true,
  isRTL = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-2',
          icon: 'w-4 h-4',
          text: 'text-xs',
          spinner: 'w-3 h-3 border'
        };
      case 'lg':
        return {
          container: 'p-4',
          icon: 'w-8 h-8',
          text: 'text-base',
          spinner: 'w-6 h-6 border-2'
        };
      default: // md
        return {
          container: 'p-3',
          icon: 'w-5 h-5',
          text: 'text-sm',
          spinner: 'w-4 h-4 border-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (!isLoading && !isSuccess) {
    return null;
  }

  return (
    <div 
      className={clsx(
        'inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-sm',
        'transition-all duration-300 ease-in-out',
        sizeClasses.container,
        isRTL && 'flex-row-reverse',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={
        isLoading 
          ? `Switching to ${targetLanguage || 'selected language'}...`
          : isSuccess 
            ? `Successfully switched to ${targetLanguage || 'new language'}`
            : ''
      }
    >
      {isLoading ? (
        <>
          <div 
            className={clsx(
              'border-gray-300 border-t-primary-600 rounded-full animate-spin',
              sizeClasses.spinner
            )}
            aria-hidden="true"
          />
          {showText && (
            <div className={clsx(
              'flex flex-col',
              isRTL && 'text-right'
            )}>
              <span className={clsx(
                'font-medium text-gray-900',
                sizeClasses.text
              )}>
                Switching Language...
              </span>
              {targetLanguage && (
                <span className={clsx(
                  'text-gray-500',
                  size === 'sm' ? 'text-xs' : 'text-xs'
                )}>
                  Loading {targetLanguage}
                </span>
              )}
            </div>
          )}
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle 
            className={clsx(
              'text-green-500 animate-pulse',
              sizeClasses.icon
            )}
            aria-hidden="true"
          />
          {showText && (
            <div className={clsx(
              'flex flex-col',
              isRTL && 'text-right'
            )}>
              <span className={clsx(
                'font-medium text-green-700',
                sizeClasses.text
              )}>
                Language Changed!
              </span>
              {targetLanguage && (
                <span className={clsx(
                  'text-green-600',
                  size === 'sm' ? 'text-xs' : 'text-xs'
                )}>
                  Now using {targetLanguage}
                </span>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

/**
 * Overlay loader for full-screen language switching
 */
export const LanguageSwitchOverlay: React.FC<{
  isVisible: boolean;
  targetLanguage?: string;
  onComplete?: () => void;
}> = ({ isVisible, targetLanguage, onComplete }) => {
  React.useEffect(() => {
    if (isVisible && onComplete) {
      // Auto-hide after 2 seconds
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Language switching in progress"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <LanguageSwitchLoader
          isLoading={true}
          targetLanguage={targetLanguage}
          size="lg"
          showText={true}
          className="border-0 shadow-none bg-transparent p-0"
        />
      </div>
    </div>
  );
};

export default LanguageSwitchLoader;
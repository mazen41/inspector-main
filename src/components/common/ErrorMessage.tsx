import React from 'react';
import clsx from 'clsx';
import { useTranslation } from '../../hooks/useTranslation';

interface ErrorMessageProps {
  message?: string;
  messageKey?: string;
  className?: string;
  onRetry?: () => void;
  retryTextKey?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message,
  messageKey, 
  className = '',
  onRetry,
  retryTextKey = 'common.buttons.retry'
}) => {
  const { t, isRTL } = useTranslation();
  
  const displayMessage = messageKey ? t(messageKey) : message;
  return (
    <div className={clsx(
      'bg-red-50 border border-red-200 rounded-lg p-4',
      className
    )}>
      <div className={clsx(
        'flex items-center',
        isRTL && 'flex-row-reverse'
      )}>
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className={clsx(
          'flex-1',
          isRTL ? 'mr-3' : 'ml-3'
        )}>
          <p className={clsx(
            'text-sm text-red-700',
            isRTL && 'text-right'
          )}>{displayMessage}</p>
        </div>
        {onRetry && (
          <div className={clsx(
            isRTL ? 'mr-3' : 'ml-3'
          )}>
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              {t(retryTextKey)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
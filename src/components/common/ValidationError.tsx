import React from 'react';
import clsx from 'clsx';
import { useTranslation } from '../../hooks/useTranslation';

interface ValidationErrorProps {
  error?: string;
  errorKey?: string;
  errors?: string[];
  errorKeys?: string[];
  className?: string;
  showIcon?: boolean;
}

/**
 * Component for displaying validation errors
 */
export const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  errorKey,
  errors,
  errorKeys,
  className = '',
  showIcon = true,
}) => {
  const { t, isRTL } = useTranslation();
  
  const getErrorMessages = () => {
    if (errorKeys) return errorKeys.map(key => t(key));
    if (errors) return errors;
    if (errorKey) return [t(errorKey)];
    if (error) return [error];
    return [];
  };
  
  const errorMessages = getErrorMessages();
  
  if (errorMessages.length === 0) {
    return null;
  }
  
  return (
    <div className={clsx(
      'text-red-600 text-sm mt-1',
      isRTL && 'text-right',
      className
    )}>
      {errorMessages.map((message, index) => (
        <div key={index} className={clsx(
          'flex items-start gap-1',
          isRTL && 'flex-row-reverse'
        )}>
          {showIcon && (
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{message}</span>
        </div>
      ))}
    </div>
  );
};

interface ValidationSummaryProps {
  errors: string[];
  errorKeys?: string[];
  title?: string;
  titleKey?: string;
  className?: string;
  maxErrors?: number;
}

/**
 * Component for displaying a summary of validation errors
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  errorKeys,
  title,
  titleKey = 'common.messages.validationErrors',
  className = '',
  maxErrors = 10,
}) => {
  const { t, isRTL } = useTranslation();
  const getErrorMessages = () => {
    if (errorKeys) return errorKeys.map(key => t(key));
    return errors;
  };
  
  const errorMessages = getErrorMessages();
  
  if (errorMessages.length === 0) {
    return null;
  }
  
  const displayErrors = errorMessages.slice(0, maxErrors);
  const hasMoreErrors = errorMessages.length > maxErrors;
  const displayTitle = titleKey ? t(titleKey) : title;
  
  return (
    <div className={clsx(
      'bg-red-50 border border-red-200 rounded-md p-4',
      className
    )}>
      <div className={clsx(
        'flex',
        isRTL && 'flex-row-reverse'
      )}>
        <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className={clsx(
          isRTL ? 'mr-3' : 'ml-3'
        )}>
          <h3 className={clsx(
            'text-sm font-medium text-red-800',
            isRTL && 'text-right'
          )}>{displayTitle}</h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className={clsx(
              'list-disc space-y-1',
              isRTL ? 'list-inside text-right' : 'list-inside'
            )}>
              {displayErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {hasMoreErrors && (
                <li className="font-medium">
                  {t('common.messages.moreErrors', { 
                    count: errorMessages.length - maxErrors,
                    plural: errorMessages.length - maxErrors !== 1 ? 's' : ''
                  })}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FieldValidationWrapperProps {
  children: React.ReactNode;
  error?: string;
  errorKey?: string;
  touched?: boolean;
  required?: boolean;
  label?: string;
  labelKey?: string;
  helpText?: string;
  helpTextKey?: string;
  className?: string;
}

/**
 * Wrapper component that adds validation styling and error display to form fields
 */
export const FieldValidationWrapper: React.FC<FieldValidationWrapperProps> = ({
  children,
  error,
  errorKey,
  touched = false,
  required = false,
  label,
  labelKey,
  helpText,
  helpTextKey,
  className = '',
}) => {
  const { t, isRTL } = useTranslation();
  
  const displayLabel = labelKey ? t(labelKey) : label;
  const displayError = errorKey ? t(errorKey) : error;
  const displayHelpText = helpTextKey ? t(helpTextKey) : helpText;
  
  const hasError = touched && displayError;
  
  return (
    <div className={clsx('space-y-1', className)}>
      {displayLabel && (
        <label className={clsx(
          'block text-sm font-medium text-gray-700',
          isRTL && 'text-right'
        )}>
          {displayLabel}
          {required && (
            <span className={clsx(
              'text-red-500',
              isRTL ? 'mr-1' : 'ml-1'
            )}>*</span>
          )}
        </label>
      )}
      
      <div className={hasError ? 'relative' : ''}>
        {children}
        {hasError && (
          <div className={clsx(
            'absolute inset-y-0 flex items-center pointer-events-none',
            isRTL ? 'left-0 pl-3' : 'right-0 pr-3'
          )}>
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {displayHelpText && !hasError && (
        <p className={clsx(
          'text-sm text-gray-500',
          isRTL && 'text-right'
        )}>{displayHelpText}</p>
      )}
      
      {hasError && <ValidationError error={displayError} />}
    </div>
  );
};

interface RequiredFieldIndicatorProps {
  required?: boolean;
  className?: string;
}

/**
 * Component for displaying required field indicator
 */
export const RequiredFieldIndicator: React.FC<RequiredFieldIndicatorProps> = ({
  required = false,
  className = '',
}) => {
  const { t } = useTranslation();
  if (!required) {
    return null;
  }
  
  return (
    <span className={clsx('text-red-500 ml-1', className)} aria-label={t('common.accessibility.required')}>
      *
    </span>
  );
};

interface ValidationStatusProps {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  className?: string;
}

/**
 * Component for displaying overall form validation status
 */
export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  isValid,
  isDirty,
  isSubmitting,
  className = '',
}) => {
  const { t, isRTL } = useTranslation();
  if (!isDirty && !isSubmitting) {
    return null;
  }
  
  if (isSubmitting) {
    return (
      <div className={clsx(
        'flex items-center text-sm text-blue-600',
        isRTL && 'flex-row-reverse',
        className
      )}>
        <div className={clsx(
          'animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600',
          isRTL ? 'ml-2' : 'mr-2'
        )}></div>
        {t('common.messages.validating')}
      </div>
    );
  }
  
  if (isValid) {
    return (
      <div className={clsx(
        'flex items-center text-sm text-green-600',
        isRTL && 'flex-row-reverse',
        className
      )}>
        <svg className={clsx(
          'h-4 w-4',
          isRTL ? 'ml-2' : 'mr-2'
        )} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {t('common.messages.formValid')}
      </div>
    );
  }
  
  return (
    <div className={clsx(
      'flex items-center text-sm text-red-600',
      isRTL && 'flex-row-reverse',
      className
    )}>
      <svg className={clsx(
        'h-4 w-4',
        isRTL ? 'ml-2' : 'mr-2'
      )} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {t('common.messages.formHasErrors')}
    </div>
  );
};
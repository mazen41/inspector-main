import React, { useId } from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelKey?: string;
  error?: string;
  errorKey?: string;
  helperText?: string;
  helperTextKey?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  labelKey,
  error,
  errorKey,
  helperText,
  helperTextKey,
  success = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className,
  id,
  required,
  disabled,
  ...props
}) => {
  const { t, isRTL } = useTranslation();
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const displayLabel = labelKey ? t(labelKey) : label;
  const displayError = errorKey ? t(errorKey) : error;
  const displayHelperText = helperTextKey ? t(helperTextKey) : helperText;

  const hasError = !!displayError;
  const hasHelper = !!displayHelperText && !hasError;

  return (
    <div className={clsx('space-y-1', !fullWidth && 'inline-block')}>
      {displayLabel && (
        <label 
          htmlFor={inputId} 
          className={clsx(
            'block text-sm font-medium',
            hasError ? 'text-red-700' : 'text-gray-700',
            disabled && 'text-gray-400',
            isRTL && 'text-right'
          )}
        >
          {displayLabel}
          {required && (
            <span className={clsx(
              'text-red-500',
              isRTL ? 'mr-1' : 'ml-1'
            )} aria-label={t('common.accessibility.required')}>
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className={clsx(
            'absolute inset-y-0 flex items-center pointer-events-none',
            isRTL ? 'right-0 pr-3' : 'left-0 pl-3'
          )}>
            <div className={clsx(
              'h-5 w-5',
              hasError ? 'text-red-400' : 'text-gray-400'
            )}>
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            leftIcon && (isRTL ? 'pr-10' : 'pl-10'),
            (rightIcon || hasError || success) && (isRTL ? 'pl-10' : 'pr-10'),
            hasError && [
              'border-red-300 text-red-900 placeholder-red-300',
              'focus:ring-red-500 focus:border-red-500',
              'error-shake'
            ],
            success && !hasError && [
              'border-green-300 text-green-900',
              'focus:ring-green-500 focus:border-green-500'
            ],
            !hasError && !success && [
              'border-gray-300 text-gray-900',
              'focus:ring-primary-500 focus:border-primary-500'
            ],
            disabled && [
              'bg-gray-50 text-gray-500 cursor-not-allowed',
              'border-gray-200'
            ],
            'sm:text-sm',
            isRTL && 'text-right',
            className
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-invalid={hasError}
          aria-describedby={clsx(
            hasError && errorId,
            hasHelper && helperId
          )}
          disabled={disabled}
          {...props}
        />
        
        {(rightIcon || hasError || success) && (
          <div className={clsx(
            'absolute inset-y-0 flex items-center pointer-events-none',
            isRTL ? 'left-0 pl-3' : 'right-0 pr-3'
          )}>
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            ) : success ? (
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            ) : (
              rightIcon && (
                <div className="h-5 w-5 text-gray-400">
                  {rightIcon}
                </div>
              )
            )}
          </div>
        )}
      </div>
      
      {hasError && (
        <p 
          id={errorId}
          className={clsx(
            'text-sm text-red-600 flex items-center',
            isRTL && 'text-right'
          )}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className={clsx(
            'h-4 w-4 flex-shrink-0',
            isRTL ? 'ml-1' : 'mr-1'
          )} aria-hidden="true" />
          {displayError}
        </p>
      )}
      
      {hasHelper && (
        <p 
          id={helperId}
          className={clsx(
            'text-sm text-gray-500',
            isRTL && 'text-right'
          )}
        >
          {displayHelperText}
        </p>
      )}
    </div>
  );
};

export default Input;
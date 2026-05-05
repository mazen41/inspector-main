import React, { useState, useCallback } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { VALIDATION_PATTERNS, INPUT_CONSTRAINTS } from '../../../utils/constants';
import {
  getInputClassName,
  getIconClassName,
  getCharacterCountClassName,
  getAccessibilityProps,
  fieldStyles
} from '../../../styles/fieldStyles';
import { useTranslation } from '../../../hooks/useTranslation';
import NotesInput from './NotesInput';

interface EmailFieldComponentProps extends FieldComponentProps {
  autoComplete?: string;
  maxLength?: number;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const EmailFieldComponent: React.FC<EmailFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  autoComplete = 'email',
  maxLength = INPUT_CONSTRAINTS.EMAIL_MAX_LENGTH,
  notes,
  onNotesChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { t } = useTranslation();

  // Convert value to string for input
  const getInputValue = useCallback(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);



  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    // Update validation state
    if (newValue.trim()) {
      const isValidEmail = VALIDATION_PATTERNS.EMAIL.test(newValue);
      setIsValid(isValidEmail);
    } else {
      setIsValid(null);
    }

    onChange(newValue);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const inputValue = getInputValue();
  const hasError = Boolean(error);
  const showValidIcon = isValid && !hasError && inputValue.trim() && !isFocused;

  const accessibilityProps = getAccessibilityProps({
    fieldId: field.id.toString(),
    hasError,
    hasHelp: Boolean(field.help_text),
    isRequired: required,
    isDisabled: disabled,
  });

  return (
    <div className={fieldStyles.container.base}>
      <div className={fieldStyles.wrapper.base}>
        <div className={fieldStyles.wrapper.withIcon}>
          <input
            type="email"
            {...accessibilityProps}
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
            placeholder={field.placeholder || t('forms.placeholders.emailPlaceholder')}
            className={getInputClassName({
              hasError,
              isDisabled: disabled,
              isFocused,
              hasLeftIcon: true,
              hasRightIcon: true,
            })}
          />

          {/* Mail icon */}
          <div className={getIconClassName({ position: 'left', isDisabled: disabled, hasError })}>
            <Mail className={fieldStyles.icons.size} />
          </div>

          {/* Validation icon */}
          <div className={getIconClassName({ position: 'right', isDisabled: disabled, hasError, isSuccess: showValidIcon || false })}>
            {showValidIcon && (
              <CheckCircle className={fieldStyles.icons.size} />
            )}
            {hasError && (
              <AlertCircle className={fieldStyles.icons.size} />
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            id={`field-${field.id}-error`}
            className={`${fieldStyles.error.base} ${fieldStyles.animations.slideIn}`}
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className={fieldStyles.error.icon} />
            <span>{error}</span>
          </div>
        )}

        {/* Help text */}
        {field.help_text && !error && (
          <div
            id={`field-${field.id}-help`}
            className={fieldStyles.helpText.base}
          >
            {field.help_text}
          </div>
        )}

        {/* Character count */}
        {inputValue.length > 0 && (
          <div className="mt-1 text-right">
            <div className={getCharacterCountClassName({
              current: inputValue.length,
              max: maxLength,
            })}>
              {inputValue.length}/{maxLength}
            </div>
          </div>
        )}

        {/* Notes Input */}
        {onNotesChange && (
          <div className="mt-3">
            <NotesInput
              fieldId={field.id}
              value={notes}
              onChange={onNotesChange}
              disabled={disabled}
              placeholder="Add notes for this field..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailFieldComponent;
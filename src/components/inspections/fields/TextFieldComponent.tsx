import React, { useState, useCallback } from 'react';
import { Type, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { FieldComponentProps } from '../../../types/inspection';
import { INPUT_CONSTRAINTS } from '../../../utils/constants';
import { 
  getInputClassName, 
  getIconClassName, 
  getCharacterCountClassName,
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import { useTranslation } from '../../../hooks/useTranslation';

interface TextFieldComponentProps extends FieldComponentProps {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
}

const TextFieldComponent: React.FC<TextFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  maxLength = INPUT_CONSTRAINTS.TEXT_MAX_LENGTH,
  minLength,
  pattern,
  autoComplete,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { t, isRTL } = useTranslation();

  // Convert value to string for input
  const getInputValue = useCallback(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
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
  const characterCount = inputValue.length;

  const accessibilityProps = getAccessibilityProps({
    fieldId: field.id.toString(),
    hasError,
    hasHelp: Boolean(field.help_text),
    isRequired: required,
    isDisabled: disabled,
  });

  return (
    <div className={fieldStyles.container.base} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={fieldStyles.wrapper.base}>
        <div className={fieldStyles.wrapper.withIcon}>
          <input
            type="text"
            {...accessibilityProps}
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            autoComplete={autoComplete}
            placeholder={field.placeholder || t('forms.placeholders.enterText')}
            className={clsx(
              getInputClassName({
                hasError,
                isDisabled: disabled,
                isFocused,
                hasLeftIcon: true,
              }),
              isRTL && 'text-right'
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          
          {/* Text icon */}
          <div className={clsx(
            getIconClassName({ position: 'left', isDisabled: disabled, hasError }),
            isRTL && 'right-0 left-auto'
          )}>
            <Type className={fieldStyles.icons.size} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div 
            id={`field-${field.id}-error`}
            className={clsx(
              fieldStyles.error.base,
              fieldStyles.animations.slideIn,
              isRTL && 'flex-row-reverse text-right'
            )}
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className={clsx(
              fieldStyles.error.icon,
              isRTL && 'ml-2 mr-0'
            )} />
            <span>{error}</span>
          </div>
        )}

        {/* Help text */}
        {field.help_text && !error && (
          <div 
            id={`field-${field.id}-help`}
            className={clsx(
              fieldStyles.helpText.base,
              isRTL && 'text-right'
            )}
          >
            {field.help_text}
          </div>
        )}

        {/* Character count */}
        {(maxLength || characterCount > 0) && (
          <div className={clsx(
            'mt-1 flex justify-between items-center',
            isRTL && 'flex-row-reverse'
          )}>
            <div></div>
            <div className={clsx(
              getCharacterCountClassName({
                current: characterCount,
                max: maxLength,
              }),
              isRTL && 'text-left'
            )}>
              {characterCount}{maxLength && `/${maxLength}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextFieldComponent;
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { INPUT_CONSTRAINTS } from '../../../utils/constants';
import { 
  getInputClassName, 
  getCharacterCountClassName,
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import { useTranslation } from '../../../hooks/useTranslation';

interface TextareaFieldComponentProps extends FieldComponentProps {
  maxLength?: number;
  minLength?: number;
  rows?: number;
  autoResize?: boolean;
  maxRows?: number;
}

const TextareaFieldComponent: React.FC<TextareaFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  maxLength = INPUT_CONSTRAINTS.TEXTAREA_MAX_LENGTH,
  minLength,
  rows = 3,
  autoResize = true,
  maxRows = 8,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert value to string for textarea
  const getTextValue = useCallback(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);

  // Auto-resize functionality
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !autoResize) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * maxRows;
    
    // Set new height (constrained by maxRows)
    const newHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [autoResize, maxRows]);

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
    
    // Adjust height after state update
    setTimeout(adjustHeight, 0);
  }, [onChange, adjustHeight]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const textValue = getTextValue();
  const hasError = Boolean(error);
  const characterCount = textValue.length;
  const lineCount = textValue.split('\n').length;

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
          <textarea
            ref={textareaRef}
            {...accessibilityProps}
            value={textValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            rows={autoResize ? 1 : rows}
            placeholder={field.placeholder || t('forms.placeholders.enterText')}
            className={`
              ${getInputClassName({
                hasError,
                isDisabled: disabled,
                isFocused,
                hasLeftIcon: true,
              })}
              ${autoResize ? 'resize-none' : 'resize-y'}
            `}
            style={{
              minHeight: `${rows * 1.5}rem`,
              ...(autoResize ? {} : { height: `${rows * 1.5}rem` })
            }}
          />
          
          {/* Text icon */}
          <div className="absolute top-2 left-0 flex items-center pl-3 pointer-events-none">
            <FileText className={`${fieldStyles.icons.size} ${
              disabled ? fieldStyles.icons.colors.disabled : fieldStyles.icons.colors.default
            }`} />
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

        {/* Character and line count */}
        {(maxLength || characterCount > 0) && (
          <div className="mt-1 flex justify-between items-center text-xs">
            <div className="text-gray-400 flex items-center gap-2">
              <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
              {autoResize && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>Auto-resize</span>
                </>
              )}
            </div>
            <div className={getCharacterCountClassName({
              current: characterCount,
              max: maxLength,
            })}>
              {characterCount}{maxLength && `/${maxLength}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextareaFieldComponent;
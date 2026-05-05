import React, { useState, useCallback } from 'react';
import { Link, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { VALIDATION_PATTERNS, INPUT_CONSTRAINTS } from '../../../utils/constants';
import { 
  getInputClassName, 
  getIconClassName, 
  getCharacterCountClassName,
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import NotesInput from './NotesInput';


interface URLFieldComponentProps extends FieldComponentProps {
  autoComplete?: string;
  maxLength?: number;
  showPreview?: boolean;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const URLFieldComponent: React.FC<URLFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  autoComplete = 'url',
  maxLength = INPUT_CONSTRAINTS.URL_MAX_LENGTH,
  showPreview = true,
  notes,
  onNotesChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);


  // Convert value to string for input
  const getInputValue = useCallback(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);



  // Normalize URL by adding protocol if missing
  const normalizeURL = useCallback((urlValue: string): string => {
    const trimmed = urlValue.trim();
    if (!trimmed) return trimmed;
    
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'https://' + trimmed;
    }
    
    return trimmed;
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Update validation state
    if (newValue.trim()) {
      const normalizedUrl = normalizeURL(newValue);
      const isValidUrl = VALIDATION_PATTERNS.URL.test(normalizedUrl);
      setIsValid(isValidUrl);
    } else {
      setIsValid(null);
    }

    onChange(newValue);
  }, [onChange, normalizeURL]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Auto-normalize URL on blur if it's valid
    const inputValue = getInputValue();
    if (inputValue.trim() && isValid) {
      const normalized = normalizeURL(inputValue);
      if (normalized !== inputValue) {
        onChange(normalized);
      }
    }
    
    onBlur?.();
  }, [onBlur, getInputValue, isValid, normalizeURL, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handlePreviewClick = useCallback(() => {
    const inputValue = getInputValue();
    if (inputValue && isValid) {
      const normalizedUrl = normalizeURL(inputValue);
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
  }, [getInputValue, isValid, normalizeURL]);

  const inputValue = getInputValue();
  const hasError = Boolean(error);
  const showValidIcon = isValid && !hasError && inputValue.trim() && !isFocused;
  const canPreview = showPreview && isValid && inputValue.trim() && !hasError;

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
            type="url"
            {...accessibilityProps}
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
            placeholder={field.placeholder || 'https://example.com'}
            className={getInputClassName({
              hasError,
              isDisabled: disabled,
              isFocused,
              hasLeftIcon: true,
              hasRightIcon: true,
            })}
            style={{ paddingRight: canPreview ? '5rem' : '2.5rem' }}
          />
          
          {/* Link icon */}
          <div className={getIconClassName({ position: 'left', isDisabled: disabled, hasError })}>
            <Link className={fieldStyles.icons.size} />
          </div>

          {/* Right side icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {/* Preview button */}
            {canPreview && (
              <button
                type="button"
                onClick={handlePreviewClick}
                className={`
                  ${fieldStyles.button.base} ${fieldStyles.button.variants.ghost}
                  mr-2 p-1 text-blue-500 hover:text-blue-700 rounded
                `}
                title="Open URL in new tab"
                aria-label="Preview URL"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
            
            {/* Validation icon */}
            <div className="pointer-events-none">
              {showValidIcon && (
                <CheckCircle className={`${fieldStyles.icons.size} ${fieldStyles.icons.colors.success}`} />
              )}
              {hasError && (
                <AlertCircle className={`${fieldStyles.icons.size} ${fieldStyles.icons.colors.error}`} />
              )}
            </div>
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

        {/* URL preview */}
        {canPreview && !isFocused && (
          <div className={`mt-2 p-3 bg-gray-50 rounded-lg border text-sm ${fieldStyles.animations.fadeIn}`}>
            <div className="flex items-center gap-2 text-gray-600">
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              <span className="truncate font-mono text-xs">{normalizeURL(inputValue)}</span>
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

export default URLFieldComponent;
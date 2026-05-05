import React, { useState, useCallback } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { 
  getInputClassName, 
  getIconClassName, 
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import { useTranslation } from '../../../hooks/useTranslation';
import NotesInput from './NotesInput';

interface DateFieldComponentProps extends FieldComponentProps {
  min?: string;
  max?: string;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const DateFieldComponent: React.FC<DateFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  min,
  max,
  notes,
  onNotesChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  // Convert value to string format for input
  const getInputValue = useCallback(() => {
    if (!value) return '';
    
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    
    if (typeof value === 'string') {
      // Handle various date string formats
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return '';
  }, [value]);



  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    if (!newValue) {
      onChange(null);
      return;
    }

    // Convert string to Date object for consistency
    const date = new Date(newValue);
    if (!isNaN(date.getTime())) {
      onChange(date);
    } else {
      onChange(newValue); // Keep invalid string for validation
    }
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
            type="date"
            {...accessibilityProps}
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            placeholder={field.placeholder || t('forms.placeholders.datePlaceholder')}
            className={getInputClassName({
              hasError,
              isDisabled: disabled,
              isFocused,
              hasRightIcon: true,
            })}
          />
          
          {/* Calendar icon */}
          <div className={getIconClassName({ position: 'right', isDisabled: disabled, hasError })}>
            <Calendar className={fieldStyles.icons.size} />
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

export default DateFieldComponent;
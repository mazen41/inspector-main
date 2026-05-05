import React, { useState, useCallback } from 'react';
import { Hash, AlertCircle, Plus, Minus } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { INPUT_CONSTRAINTS } from '../../../utils/constants';
import { 
  getInputClassName, 
  getIconClassName, 
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import { useTranslation } from '../../../hooks/useTranslation';
import NotesInput from './NotesInput';

interface NumberFieldComponentProps extends FieldComponentProps {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  showControls?: boolean;
  allowNegative?: boolean;
  allowDecimals?: boolean;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const NumberFieldComponent: React.FC<NumberFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  min = INPUT_CONSTRAINTS.NUMBER_MIN,
  max = INPUT_CONSTRAINTS.NUMBER_MAX,
  step = 1,
  precision = 2,
  showControls = true,
  allowNegative = true,
  allowDecimals = true,
  notes,
  onNotesChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  // Convert value to number
  const getNumberValue = useCallback(() => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    return isNaN(num) ? '' : num;
  }, [value]);



  // Validate number constraints
  const validateNumber = useCallback((num: number): number => {
    if (isNaN(num)) return 0;
    
    // Apply min/max constraints
    let validatedNum = Math.max(min, Math.min(max, num));
    
    // Handle negative values
    if (!allowNegative && validatedNum < 0) {
      validatedNum = 0;
    }
    
    // Handle decimals
    if (!allowDecimals) {
      validatedNum = Math.round(validatedNum);
    } else if (precision > 0) {
      validatedNum = Math.round(validatedNum * Math.pow(10, precision)) / Math.pow(10, precision);
    }
    
    return validatedNum;
  }, [min, max, allowNegative, allowDecimals, precision]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Allow empty string for clearing
    if (inputValue === '') {
      onChange(null);
      return;
    }
    
    // Parse and validate number
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      onChange(num);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Validate and format on blur
    const currentValue = getNumberValue();
    if (typeof currentValue === 'number') {
      const validatedValue = validateNumber(currentValue);
      if (validatedValue !== currentValue) {
        onChange(validatedValue);
      }
    }
    
    onBlur?.();
  }, [onBlur, getNumberValue, validateNumber, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleIncrement = useCallback(() => {
    const currentValue = getNumberValue();
    const num = typeof currentValue === 'number' ? currentValue : 0;
    const newValue = validateNumber(num + step);
    onChange(newValue);
  }, [getNumberValue, step, validateNumber, onChange]);

  const handleDecrement = useCallback(() => {
    const currentValue = getNumberValue();
    const num = typeof currentValue === 'number' ? currentValue : 0;
    const newValue = validateNumber(num - step);
    onChange(newValue);
  }, [getNumberValue, step, validateNumber, onChange]);

  const currentValue = getNumberValue();
  const hasError = Boolean(error);
  const canIncrement = typeof currentValue === 'number' ? currentValue < max : true;
  const canDecrement = typeof currentValue === 'number' ? currentValue > min : true;

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
        <div className={fieldStyles.wrapper.withControls}>
          <input
            type="number"
            {...accessibilityProps}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            placeholder={field.placeholder || t('forms.placeholders.enterText')}
            className={`
              ${getInputClassName({
                hasError,
                isDisabled: disabled,
                isFocused,
                hasLeftIcon: true,
                hasControls: showControls,
              })}
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
          
          {/* Hash icon */}
          <div className={getIconClassName({ position: 'left', isDisabled: disabled, hasError })}>
            <Hash className={fieldStyles.icons.size} />
          </div>

          {/* Number controls */}
          {showControls && (
            <div className="absolute inset-y-0 right-0 flex flex-col">
              <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || !canIncrement}
                className={`
                  ${fieldStyles.button.base} ${fieldStyles.button.sizes.sm}
                  flex-1 px-2 border-l rounded-tr-lg
                  hover:bg-gray-50 focus:ring-1 focus:ring-blue-500
                  ${hasError ? 'border-red-300' : 'border-gray-300'}
                `}
                aria-label="Increment value"
              >
                <Plus className="h-3 w-3 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={handleDecrement}
                disabled={disabled || !canDecrement}
                className={`
                  ${fieldStyles.button.base} ${fieldStyles.button.sizes.sm}
                  flex-1 px-2 border-l border-t rounded-br-lg
                  hover:bg-gray-50 focus:ring-1 focus:ring-blue-500
                  ${hasError ? 'border-red-300 border-t-red-300' : 'border-gray-300 border-t-gray-300'}
                `}
                aria-label="Decrement value"
              >
                <Minus className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
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

        {/* Range indicator */}
        {(min !== INPUT_CONSTRAINTS.NUMBER_MIN || max !== INPUT_CONSTRAINTS.NUMBER_MAX) && (
          <div className="mt-1 text-xs text-gray-400">
            Range: {min} to {max}
            {step !== 1 && ` (step: ${step})`}
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

export default NumberFieldComponent;
import React, { useCallback } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { FIELD_DEFAULTS } from '../../../utils/constants';
import { 
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import NotesInput from './NotesInput';

interface BooleanFieldComponentProps extends FieldComponentProps {
  variant?: 'checkbox' | 'toggle' | 'buttons';
  trueLabel?: string;
  falseLabel?: string;
  showLabels?: boolean;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const BooleanFieldComponent: React.FC<BooleanFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  variant = 'checkbox',
  trueLabel = FIELD_DEFAULTS.BOOLEAN_TRUE_LABEL,
  falseLabel = FIELD_DEFAULTS.BOOLEAN_FALSE_LABEL,
  showLabels = true,
  notes,
  onNotesChange,
}) => {
  // Convert value to boolean
  const getBooleanValue = useCallback(() => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return Boolean(value);
  }, [value]);

  const handleChange = useCallback((newValue: boolean) => {
    onChange(newValue);
  }, [onChange]);

  const booleanValue = getBooleanValue();
  const hasError = Boolean(error);

  const accessibilityProps = getAccessibilityProps({
    fieldId: field.id.toString(),
    hasError,
    hasHelp: Boolean(field.help_text),
    isRequired: required,
    isDisabled: disabled,
  });

  // Checkbox variant
  if (variant === 'checkbox') {
    return (
      <div className={fieldStyles.container.base}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              {...accessibilityProps}
              checked={booleanValue}
              onChange={(e) => handleChange(e.target.checked)}
              onBlur={onBlur}
              disabled={disabled}
              required={required}
              className={`
                ${fieldStyles.checkbox.base}
                ${hasError ? fieldStyles.checkbox.error : ''}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            />
          </div>
          
          {showLabels && (
            <label
              htmlFor={`field-${field.id}`}
              className={`
                text-sm font-medium cursor-pointer select-none transition-colors
                ${disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : hasError
                  ? 'text-red-700'
                  : 'text-gray-700 hover:text-gray-900'
                }
              `}
            >
              {field.description || field.name}
            </label>
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
    );
  }

  // Toggle variant
  if (variant === 'toggle') {
    return (
      <div className={fieldStyles.container.base}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => !disabled && handleChange(!booleanValue)}
            onBlur={onBlur}
            disabled={disabled}
            className={`
              ${fieldStyles.toggle.base}
              ${booleanValue
                ? hasError
                  ? fieldStyles.toggle.track.error
                  : fieldStyles.toggle.track.on
                : fieldStyles.toggle.track.off
              }
            `}
            aria-pressed={booleanValue}
            {...accessibilityProps}
          >
            <span
              className={`
                ${fieldStyles.toggle.thumb}
                ${booleanValue 
                  ? fieldStyles.toggle.thumbPosition.on 
                  : fieldStyles.toggle.thumbPosition.off
                }
              `}
            />
          </button>
          
          {showLabels && (
            <span
              className={`
                text-sm font-medium select-none transition-colors
                ${disabled 
                  ? 'text-gray-400' 
                  : hasError
                  ? 'text-red-700'
                  : 'text-gray-700'
                }
              `}
            >
              {booleanValue ? trueLabel : falseLabel}
            </span>
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
    );
  }

  // Button variant
  return (
    <div className={fieldStyles.container.base}>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={() => !disabled && handleChange(true)}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            ${fieldStyles.button.base} ${fieldStyles.button.sizes.md}
            flex items-center gap-2 px-4 py-2 rounded-lg border
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-blue-500'
            }
            ${booleanValue
              ? hasError
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }
          `}
          aria-pressed={booleanValue}
          {...accessibilityProps}
        >
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">{trueLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => !disabled && handleChange(false)}
          disabled={disabled}
          className={`
            ${fieldStyles.button.base} ${fieldStyles.button.sizes.md}
            flex items-center gap-2 px-4 py-2 rounded-lg border
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-blue-500'
            }
            ${!booleanValue
              ? hasError
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }
          `}
          aria-pressed={!booleanValue}
        >
          <X className="h-4 w-4" />
          <span className="text-sm font-medium">{falseLabel}</span>
        </button>
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
  );
};

export default BooleanFieldComponent;
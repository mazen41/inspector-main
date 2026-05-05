import React, { useCallback, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { 
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import NotesInput from './NotesInput';

interface RadioFieldComponentProps extends FieldComponentProps {
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const RadioFieldComponent: React.FC<RadioFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  layout = 'vertical',
  columns = 2,
  notes,
  onNotesChange,
}) => {
  const fieldId = useId();
  const groupName = `radio-field-${field.id}-${fieldId}`;

  // Get options from field configuration
  const options = field.field_options?.options || field.options || [];

  // Convert value to string for comparison
  const getStringValue = useCallback(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const currentIndex = options.indexOf(getStringValue());
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex && options[nextIndex]) {
      onChange(options[nextIndex]);
      // Focus the next radio button
      const nextRadio = document.querySelector(
        `input[name="${groupName}"][value="${options[nextIndex]}"]`
      ) as HTMLInputElement;
      nextRadio?.focus();
    }
  }, [options, getStringValue, onChange, groupName]);

  const currentValue = getStringValue();
  const hasError = Boolean(error);

  // Determine layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'grid':
        return `grid gap-3 grid-cols-1 sm:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`;
      default:
        return 'space-y-3';
    }
  };

  const accessibilityProps = getAccessibilityProps({
    fieldId: field.id.toString(),
    hasError,
    hasHelp: Boolean(field.help_text),
    isRequired: required,
    isDisabled: disabled,
  });

  if (options.length === 0) {
    return (
      <div className={fieldStyles.container.base}>
        <div className="text-gray-500 italic text-sm p-3 border border-gray-200 rounded-lg bg-gray-50">
          No options available for this field
        </div>
      </div>
    );
  }

  return (
    <div className={fieldStyles.container.base}>
      <fieldset
        className={`
          ${hasError ? 'border-red-300' : 'border-gray-200'}
          ${disabled ? 'opacity-50' : ''}
        `}
        {...accessibilityProps}
        disabled={disabled}
      >
        <div className={getLayoutClasses()}>
          {options.map((option, index) => {
            const optionId = `${groupName}-option-${index}`;
            const isSelected = currentValue === option;
            
            return (
              <div key={option} className="relative">
                <label
                  htmlFor={optionId}
                  className={`
                    ${fieldStyles.multiSelect.option}
                    ${isSelected ? fieldStyles.multiSelect.optionSelected : ''}
                    ${hasError ? fieldStyles.multiSelect.optionError : ''}
                    ${disabled ? 'cursor-not-allowed bg-gray-50 opacity-50' : 'hover:bg-gray-50 hover:border-gray-300'}
                  `}
                >
                  <input
                    type="radio"
                    id={optionId}
                    name={groupName}
                    value={option}
                    checked={isSelected}
                    onChange={handleChange}
                    onBlur={onBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    required={required}
                    className={`
                      ${fieldStyles.radio.base}
                      ${hasError ? fieldStyles.radio.error : ''}
                      ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    aria-describedby={
                      error ? `field-${field.id}-error` : undefined
                    }
                  />
                  
                  <span 
                    className={`
                      text-sm font-medium select-none
                      ${disabled 
                        ? 'text-gray-400' 
                        : isSelected
                        ? hasError
                          ? 'text-red-700'
                          : 'text-blue-700'
                        : 'text-gray-700'
                      }
                    `}
                  >
                    {option}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Error message */}
      {error && (
        <div 
          id={`field-${field.id}-error`}
          className={`${fieldStyles.error.base} ${fieldStyles.animations.slideIn} mt-2`}
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
          className={`${fieldStyles.helpText.base} mt-2`}
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

export default RadioFieldComponent;
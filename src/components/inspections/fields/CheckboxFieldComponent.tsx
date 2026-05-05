import React, { useCallback, useMemo } from 'react';
import { AlertCircle, Check, Minus } from 'lucide-react';
import type { FieldComponentProps } from '../../../types/inspection';
import { 
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import NotesInput from './NotesInput';
import { useTranslation } from '@/hooks';

interface CheckboxFieldComponentProps extends FieldComponentProps {
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  maxSelections?: number;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const CheckboxFieldComponent: React.FC<CheckboxFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  layout = 'vertical',
  columns = 2,
  maxSelections,
  notes,
  onNotesChange,
}) => {
  const { t } = useTranslation();
  // Get options from field configuration
  const options = field.field_options?.options || field.options || [];

  // Convert value to array of strings
  const getSelectedValues = useCallback((): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(v => String(v));
    }
    if (typeof value === 'string') {
      // Handle comma-separated string values
      return value.split(',').map(v => v.trim()).filter(v => v);
    }
    return [String(value)];
  }, [value]);

  const selectedValues = getSelectedValues();

  // Check if we can select more items
  const canSelectMore = useMemo(() => {
    if (!maxSelections) return true;
    return selectedValues.length < maxSelections;
  }, [selectedValues.length, maxSelections]);

  // Handle individual checkbox change
  const handleOptionChange = useCallback((option: string, checked: boolean) => {
    const currentValues = getSelectedValues();
    
    let newValues: string[];
    if (checked) {
      // Add option if not already selected and within limits
      if (!currentValues.includes(option) && canSelectMore) {
        newValues = [...currentValues, option];
      } else {
        return; // Don't change if already selected or at max limit
      }
    } else {
      // Remove option
      newValues = currentValues.filter(v => v !== option);
    }
    
    onChange(newValues);
  }, [getSelectedValues, onChange, canSelectMore]);

  // Handle select all functionality
  const handleSelectAll = useCallback(() => {
    const allSelected = options.every(option => selectedValues.includes(option));
    
    if (allSelected) {
      // Deselect all
      onChange([]);
    } else {
      // Select all (respecting max limit)
      const newValues = maxSelections 
        ? options.slice(0, maxSelections)
        : options;
      onChange(newValues);
    }
  }, [options, selectedValues, onChange, maxSelections]);

  const hasError = Boolean(error);
  const allSelected = options.length > 0 && options.every(option => selectedValues.includes(option));
  const someSelected = selectedValues.length > 0 && selectedValues.length < options.length;

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
          {t('inspections:fields.checkbox.noOptionsAvailable')}
        </div>
      </div>
    );
  }

  return (
    <div className={fieldStyles.container.base}>
      {/* Select All option (if more than 3 options) */}
      {options.length > 3 && !maxSelections && (
        <div className={fieldStyles.multiSelect.selectAll}>
          <label
            className={`
              flex items-center gap-3 p-2 rounded-lg cursor-pointer
              transition-all duration-200
              ${disabled 
                ? 'cursor-not-allowed opacity-50' 
                : 'hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500'
              }
            `}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                disabled={disabled}
                className="sr-only"
              />
              <div 
                className={`
                  w-4 h-4 border-2 rounded flex items-center justify-center
                  transition-colors duration-200
                  ${disabled 
                    ? 'border-gray-300 bg-gray-100' 
                    : allSelected
                    ? 'border-blue-500 bg-blue-500'
                    : someSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 hover:border-blue-400'
                  }
                `}
              >
                {allSelected && (
                  <Check className="w-3 h-3 text-white" />
                )}
                {someSelected && !allSelected && (
                  <Minus className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
            
            <span className="text-sm font-medium text-gray-700">
              {t('inspections:fields.checkbox.selectAll')} ({selectedValues.length}/{options.length})
            </span>
          </label>
        </div>
      )}

      <fieldset
        className={`
          ${hasError ? 'border-red-300' : 'border-gray-200'}
          ${disabled ? 'opacity-50' : ''}
        `}
        {...accessibilityProps}
        disabled={disabled}
      >
        <div className={getLayoutClasses()}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            const isDisabledOption = disabled || (!isSelected && !canSelectMore);
            
            return (
              <div key={option} className="relative">
                <label
                  className={`
                    ${fieldStyles.multiSelect.option}
                    ${isSelected ? fieldStyles.multiSelect.optionSelected : ''}
                    ${hasError ? fieldStyles.multiSelect.optionError : ''}
                    ${isDisabledOption ? 'cursor-not-allowed bg-gray-50 opacity-50' : 'hover:bg-gray-50 hover:border-gray-300'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleOptionChange(option, e.target.checked)}
                    onBlur={onBlur}
                    disabled={isDisabledOption}
                    className={`
                      ${fieldStyles.checkbox.base}
                      ${hasError ? fieldStyles.checkbox.error : ''}
                      ${isDisabledOption ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    aria-describedby={
                      error ? `field-${field.id}-error` : undefined
                    }
                  />
                  
                  <span 
                    className={`
                      text-sm font-medium select-none
                      ${isDisabledOption 
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

      {/* Selection info */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <div>
          {selectedValues.length > 0 && (
            <span>
              {selectedValues.length} {t('inspections.fields.checkbox.selected')}
              {maxSelections && ` ${t('inspections.fields.checkbox.of')} ${maxSelections} ${t('inspections.fields.checkbox.max')}`}
            </span>
          )}
          {selectedValues.length === 0 && required && (
            <span>{t('inspections:fields.checkbox.pleaseSelectAtLeastOne')}</span>
          )}
        </div>
        
        {maxSelections && selectedValues.length >= maxSelections && (
          <span className="text-amber-600">
            {t('inspections.fields.checkbox.maximumSelectionsReached')}
          </span>
        )}
      </div>

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

      {/* Selected values summary */}
      {/* {selectedValues.length > 0 && !error && (
        <div className={`${fieldStyles.multiSelect.summary} ${fieldStyles.animations.fadeIn}`}>
          <div className="font-medium text-gray-700 mb-1">{t('inspections.fields.checkbox.selectedValuesSummary', { count: selectedValues.length })}</div>
          <div className="text-gray-600 flex flex-wrap gap-1">
            {selectedValues.map((value, index) => (
              <span key={value} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {value}
                {index < selectedValues.length - 1 && <span className="ml-1">•</span>}
              </span>
            ))}
          </div>
        </div>
      )} */}

      {/* Notes Input */}
      {onNotesChange && (
        <div className="mt-3">
          <NotesInput
            fieldId={field.id}
            value={notes}
            onChange={onNotesChange}
            disabled={disabled}
            placeholder={t('inspections.fields.checkbox.addNotesPlaceholder')}
          />
        </div>
      )}
    </div>
  );
};

export default CheckboxFieldComponent;
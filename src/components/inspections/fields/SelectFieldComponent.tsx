import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { FieldComponentProps } from '../../../types/inspection';
import { 
  getInputClassName, 
  getAccessibilityProps,
  fieldStyles 
} from '../../../styles/fieldStyles';
import { useTranslation } from '../../../hooks/useTranslation';
import NotesInput from './NotesInput';

interface SelectFieldComponentProps extends FieldComponentProps {
  searchable?: boolean;
  clearable?: boolean;
  placeholder?: string;
  notes?: string | null;
  onNotesChange?: (notes: string) => void;
}

const SelectFieldComponent: React.FC<SelectFieldComponentProps> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  searchable = false,
  clearable = true,
  placeholder,
  notes,
  onNotesChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, isRTL } = useTranslation();

  // Get options from field configuration
  const options = field.field_options?.options || field.options || [];

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Convert value to string for comparison
  const getStringValue = useCallback(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);

  // Get display text for selected value
  const getDisplayText = useCallback(() => {
    const stringValue = getStringValue();
    if (!stringValue) {
      return placeholder || field.placeholder || t('forms.placeholders.selectOption');
    }
    return stringValue;
  }, [getStringValue, placeholder, field.placeholder, t]);

  // Handle option selection
  const handleSelect = useCallback((option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  }, [onChange]);

  // Handle clear selection
  const handleClear = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(null);
    setSearchTerm('');
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [isOpen, focusedIndex, filteredOptions, handleSelect]);

  // Handle search input change
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setFocusedIndex(-1);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const currentValue = getStringValue();
  const hasError = Boolean(error);
  const hasValue = Boolean(currentValue);

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
        <div className={clsx(
          'text-gray-500 italic text-sm p-3 border border-gray-200 rounded-lg bg-gray-50',
          isRTL && 'text-right'
        )}>
          {t('common.messages.noData')}
        </div>
      </div>
    );
  }

  return (
    <div className={fieldStyles.container.base} ref={containerRef} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={fieldStyles.wrapper.base}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            getInputClassName({
              hasError,
              isDisabled: disabled,
              isFocused: isOpen,
              hasRightIcon: true,
            }),
            isRTL ? 'text-right pl-10 pr-3' : 'text-left pr-10 pl-3',
            !hasValue ? 'text-gray-500' : 'text-gray-900'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          {...accessibilityProps}
        >
          <span className="block truncate">
            {getDisplayText()}
          </span>
          
          <div className={clsx(
            'absolute inset-y-0 flex items-center',
            isRTL ? 'left-0 pl-2' : 'right-0 pr-2'
          )}>
            {hasValue && clearable && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className={clsx(
                  'p-1 text-gray-400 hover:text-gray-600 rounded',
                  isRTL ? 'ml-1' : 'mr-1'
                )}
                aria-label={t('common.buttons.clear')}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className={`${fieldStyles.select.dropdown} ${fieldStyles.animations.fadeIn}`}>
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={t('forms.placeholders.searchPlaceholder')}
                    className={fieldStyles.select.search}
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto" role="listbox">
              {filteredOptions.length === 0 ? (
                <div className={clsx(
                  'px-3 py-2 text-sm text-gray-500',
                  isRTL && 'text-right'
                )}>
                  {searchTerm ? t('common.messages.noResults') : t('common.messages.noData')}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = currentValue === option;
                  const isFocused = index === focusedIndex;
                  
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`
                        ${fieldStyles.select.option}
                        ${isFocused ? fieldStyles.select.optionFocused : ''}
                        ${isSelected ? fieldStyles.select.optionSelected : ''}
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{option}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
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

export default SelectFieldComponent;
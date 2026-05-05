import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown, Globe, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useGetLanguagesQuery } from '../../store/api/languageApi';

import { useLocalizationError } from '../../hooks/useLocalizationError';
import LanguageSwitchError from './LanguageSwitchError';
import type { Language } from '../../types/localization';

interface LanguageSelectorProps {
  className?: string;
  showText?: boolean;
  placement?: 'header' | 'sidebar' | 'modal';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
  showText = true,
  placement = 'header'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [switchingLanguage, setSwitchingLanguage] = useState<string | null>(null);
  const { currentLanguage, changeLanguage, isLoading: translationLoading } = useTranslation();
  const { data: languages = [], isLoading: languagesLoading, error: apiError } = useGetLanguagesQuery();
  const { error: localizationError, hasError, clearError, resetToDefault } = useLocalizationError();
  //const { announce } = useAccessibility();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation with enhanced accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          handleLanguageSelect(languages[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          const newIndex = focusedIndex < languages.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(newIndex);
          // Announce the focused language
          if (languages[newIndex]) {
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const newIndex = focusedIndex > 0 ? focusedIndex - 1 : languages.length - 1;
          setFocusedIndex(newIndex);
          // Announce the focused language
          if (languages[newIndex]) {
          }
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
          if (languages[0]) {
          }
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(languages.length - 1);
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
      // Type-ahead search functionality
      default:
        if (isOpen && event.key.length === 1) {
          const searchChar = event.key.toLowerCase();
          
          // Find language starting with typed character
          const matchingIndex = languages.findIndex((lang, index) => 
            index > focusedIndex && lang.name.toLowerCase().startsWith(searchChar)
          );
          
          if (matchingIndex !== -1) {
            setFocusedIndex(matchingIndex);
          } else {
            // Wrap around to beginning
            const wrapIndex = languages.findIndex(lang => 
              lang.name.toLowerCase().startsWith(searchChar)
            );
            if (wrapIndex !== -1) {
              setFocusedIndex(wrapIndex);
            }
          }
        }
        break;
    }
  };

  // Focus management for keyboard navigation
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  const handleLanguageSelect = async (language: Language) => {
    if (language.code !== currentLanguage?.code) {
      try {
        setSwitchingLanguage(language.code);
        clearError(); // Clear any previous errors
        
        await changeLanguage(language.code);
      } catch (error) {
        console.error('Language switch failed:', error);
      } finally {
        setSwitchingLanguage(null);
      }
    }
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleButtonClick = () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    if (!wasOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  };

  // Loading state
  if (languagesLoading || translationLoading) {
    return (
      <div className={clsx('animate-pulse', className)} role="status" aria-label="Loading languages">
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
        <span className="sr-only">Loading available languages...</span>
      </div>
    );
  }

  // No languages available
  if (!languages.length) {
    return null;
  }

  // Get placement-specific styles
  const getPlacementStyles = () => {
    switch (placement) {
      case 'sidebar':
        return {
          button: 'w-full justify-start px-3 py-2 text-sm',
          dropdown: 'left-0 mt-1 w-full',
          option: 'px-3 py-2 text-sm'
        };
      case 'modal':
        return {
          button: 'px-3 py-2 text-sm',
          dropdown: 'right-0 mt-1 w-48',
          option: 'px-3 py-2 text-sm'
        };
      default: // header
        return {
          button: 'px-3 py-2 text-sm',
          dropdown: 'right-0 mt-1 w-48',
          option: 'px-3 py-2 text-sm'
        };
    }
  };

  const styles = getPlacementStyles();

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Error display */}
      {hasError && localizationError && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <LanguageSwitchError
            error={localizationError}
            targetLanguage={switchingLanguage || undefined}
            onRetry={() => {
              clearError();
              if (switchingLanguage) {
                const targetLang = languages.find(l => l.code === switchingLanguage);
                if (targetLang) {
                  handleLanguageSelect(targetLang);
                }
              }
            }}
            onReset={resetToDefault}
            onDismiss={clearError}
            isRTL={currentLanguage?.rtl}
          />
        </div>
      )}
      
      {/* API Error display */}
      {apiError && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-sm text-red-700">
                Failed to load available languages. Please refresh the page.
              </span>
            </div>
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          'inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'transition-colors duration-200',
          styles.button
        )}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={currentLanguage ? `Current language: ${currentLanguage.name}. Click to change language.` : 'Select language'}
        aria-describedby="language-selector-description"
        id="language-selector-button"
        disabled={Boolean(switchingLanguage)}
      >
        {switchingLanguage ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
            {showText && (
              <span className="text-gray-500">Switching...</span>
            )}
          </>
        ) : currentLanguage ? (
          <>
            {currentLanguage.image ? (
              <img
                src={currentLanguage.image}
                alt={`${currentLanguage.name} flag`}
                className="w-4 h-4 rounded-sm object-cover"
                onError={(e) => {
                  // Fallback to globe icon if flag image fails to load
                  e.currentTarget.style.display = 'none';
                  const globeIcon = e.currentTarget.nextElementSibling as HTMLElement;
                  if (globeIcon) {
                    globeIcon.style.display = 'block';
                  }
                }}
              />
            ) : null}
            <Globe 
              className="w-4 h-4 text-gray-500" 
              style={{ display: currentLanguage.image ? 'none' : 'block' }}
              aria-hidden="true"
            />
            {showText && (
              <span className={clsx(
                'font-medium',
                hasError ? 'text-red-600' : 'text-gray-700'
              )}>
                {currentLanguage.name}
                {hasError && ' (Error)'}
              </span>
            )}
          </>
        ) : (
          <>
            <Globe className="w-4 h-4 text-gray-500" />
            {showText && (
              <span className="text-gray-700">Select Language</span>
            )}
          </>
        )}
        <ChevronDown 
          className={clsx(
            'w-4 h-4 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Hidden description for screen readers */}
      <div id="language-selector-description" className="sr-only">
        Use arrow keys to navigate language options. Press Enter or Space to select. Press Escape to close.
      </div>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg',
            'max-h-60 overflow-auto',
            styles.dropdown
          )}
          role="listbox"
          aria-labelledby="language-selector-button"
          aria-describedby="language-selector-description"
          aria-activedescendant={focusedIndex >= 0 ? `language-option-${languages[focusedIndex]?.id}` : undefined}
        >
          {languages.map((language, index) => (
            <button
              key={language.id}
              ref={(el) => {
                optionsRef.current[index] = el;
              }}
              type="button"
              className={clsx(
                'w-full flex items-center gap-3 hover:bg-gray-50',
                'focus:outline-none focus:bg-gray-50 transition-colors duration-150',
                styles.option,
                currentLanguage?.code === language.code && 'bg-primary-50 text-primary-700',
                focusedIndex === index && 'bg-gray-100 ring-2 ring-primary-500 ring-inset'
              )}
              onClick={() => handleLanguageSelect(language)}
              onKeyDown={handleKeyDown}
              role="option"
              aria-selected={currentLanguage?.code === language.code}
              aria-label={`Select ${language.name} language${language.rtl ? ' (Right-to-left)' : ''}`}
              id={`language-option-${language.id}`}
              tabIndex={-1}
            >
              {language.image ? (
                <img
                  src={language.image}
                  alt={`${language.name} flag`}
                  className="w-4 h-4 rounded-sm object-cover flex-shrink-0"
                  onError={(e) => {
                    // Fallback to globe icon if flag image fails to load
                    e.currentTarget.style.display = 'none';
                    const globeIcon = e.currentTarget.nextElementSibling as HTMLElement;
                    if (globeIcon) {
                      globeIcon.style.display = 'block';
                    }
                  }}
                />
              ) : null}
              <Globe 
                className="w-4 h-4 text-gray-500 flex-shrink-0" 
                style={{ display: language.image ? 'none' : 'block' }}
                aria-hidden="true"
              />
              <span className="text-gray-900 font-medium truncate">
                {language.name}
              </span>
              {currentLanguage?.code === language.code && (
                <span className="ml-auto text-primary-600 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { clearError, setCurrentLanguage } from '../store/slices/localizationSlice';
import { removeFromLocalStorage } from '../utils/localStorage';

interface UseLocalizationErrorReturn {
  error: string | null;
  hasError: boolean;
  clearError: () => void;
  resetToDefault: () => void;
  retryLastAction: () => void;
}

/**
 * Hook for managing localization errors and recovery actions
 */
export function useLocalizationError(): UseLocalizationErrorReturn {
  const dispatch = useDispatch();
  const { error, availableLanguages } = useSelector((state: RootState) => state.localization);
  
  const hasError = Boolean(error);

  /**
   * Clear the current error state
   */
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Reset to default language and clear error
   */
  const resetToDefault = useCallback(() => {
    const defaultLanguage = availableLanguages.find(lang => lang.is_default) || availableLanguages[0];
    
    if (defaultLanguage) {
      // Clear saved language preference
      removeFromLocalStorage('preferred-language');
      
      // Set default language
      dispatch(setCurrentLanguage(defaultLanguage));
      
      // Clear error
      dispatch(clearError());
      
      console.log(`Reset to default language: ${defaultLanguage.name}`);
    } else {
      console.error('No default language available for reset');
    }
  }, [availableLanguages, dispatch]);

  /**
   * Retry the last failed action (typically language change)
   */
  const retryLastAction = useCallback(() => {
    // Clear error to allow retry
    dispatch(clearError());
    
    // The actual retry logic would depend on what action failed
    // This is mainly for clearing the error state to allow user to try again
    console.log('Cleared error state for retry');
  }, [dispatch]);

  return {
    error,
    hasError,
    clearError: handleClearError,
    resetToDefault,
    retryLastAction
  };
}

/**
 * Hook for checking if a specific translation key exists
 * Useful for conditional rendering based on translation availability
 */
export function useTranslationExists() {
  const translations = useSelector((state: RootState) => state.localization.translations);
  const currentLanguage = useSelector((state: RootState) => state.localization.currentLanguage);

  return useCallback((key: string): boolean => {
    if (!currentLanguage || !translations[currentLanguage.code]) {
      return false;
    }

    const languageTranslations = translations[currentLanguage.code];
    const keyParts = key.split('.');
    
    if (keyParts.length < 2) {
      return false;
    }

    const [namespace, ...pathParts] = keyParts;
    
    if (!languageTranslations[namespace]) {
      return false;
    }

    let current: any = languageTranslations[namespace];
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }

    return typeof current === 'string' && current.length > 0;
  }, [translations, currentLanguage]);
}
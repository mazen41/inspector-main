import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setCurrentLanguage, setTranslations, setLoading, setError } from '../store/slices/localizationSlice';
import { loadTranslationsWithFallback, selectBestLanguage } from '../utils/translationUtils';
import { updateDirection, initializeDirection } from '../utils/directionUtils';
import { getFromLocalStorage, setToLocalStorage, removeFromLocalStorage } from '../utils/localStorage';
import type {
  LocalizationContextType
} from '../types/localization';

// Create the context
export const LocalizationContext = createContext<LocalizationContextType | null>(null);

// Local storage key for language preference
const LANGUAGE_STORAGE_KEY = 'preferred-language';

interface LocalizationProviderProps {
  children: React.ReactNode;
}

/**
 * LocalizationProvider component that manages localization state
 * Provides language switching logic with localStorage persistence
 * Handles automatic translation loading when language changes
 */
export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const dispatch = useDispatch();

  // Get localization state from Redux store
  const {
    currentLanguage,
    availableLanguages,
    translations,
    isLoading
  } = useSelector((state: RootState) => state.localization);

  /**
   * Load translations for a specific language with comprehensive error handling
   */
  const loadLanguageTranslations = useCallback(async (languageCode: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { translations: languageTranslations, hasErrors, errorDetails } = await loadTranslationsWithFallback(languageCode);
      dispatch(setTranslations({ languageCode, translations: languageTranslations }));

      if (hasErrors && errorDetails) {
        const warningMessage = `Translations loaded with issues for ${languageCode}: ${errorDetails.join('; ')}`;
        console.warn(warningMessage);
        // Don't set error state for warnings, just log them
      } else {
        console.log(`Translations loaded successfully for language: ${languageCode}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load translations';
      console.error(`Failed to load translations for ${languageCode}:`, error);
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * Change the current language and load its translations with user feedback
   */
  const changeLanguage = useCallback(async (languageCode: string) => {
    // Find the language object from available languages
    const targetLanguage = availableLanguages.find(lang => lang.code === languageCode);

    if (!targetLanguage) {
      const errorMessage = `Language with code '${languageCode}' not found in available languages`;
      console.error(errorMessage);
      dispatch(setError(errorMessage));
      return;
    }

    try {
      // Set loading state and clear any previous errors
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Add a small delay to show loading state for better UX
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set the new current language
      dispatch(setCurrentLanguage(targetLanguage));

      // Save preference to localStorage with error handling
      const saved = setToLocalStorage(LANGUAGE_STORAGE_KEY, languageCode);
      if (!saved) {
        console.warn('Failed to save language preference to localStorage');
        // Continue with language change even if localStorage fails
      }

      // Load translations if not already loaded
      if (!translations[languageCode]) {
        await loadLanguageTranslations(languageCode);
      }

      // Update document direction for RTL/LTR support with smooth transition
      updateDirection(targetLanguage);

      // Add a brief delay to allow for smooth transitions
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log(`Language changed to: ${targetLanguage.name} (${languageCode})`);

      // Dispatch a custom event for components to listen to
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: {
          previousLanguage: currentLanguage,
          newLanguage: targetLanguage,
          languageCode
        }
      }));

    } catch (error) {
      const errorMessage = `Failed to change language to ${languageCode}`;
      console.error(errorMessage, error);
      dispatch(setError(errorMessage));

      // Revert to previous language if change failed
      if (currentLanguage && currentLanguage.code !== languageCode) {
        console.log(`Reverting to previous language: ${currentLanguage.name}`);
        dispatch(setCurrentLanguage(currentLanguage));
        updateDirection(currentLanguage);
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [availableLanguages, translations, dispatch, loadLanguageTranslations, currentLanguage]);



  /**
   * Initialize language from environment variable, localStorage, or API default language
   */
  const initializeLanguage = useCallback(async () => {
    if (availableLanguages.length === 0) {
      return; // Wait for languages to be loaded from API
    }

    try {
      // Get saved language preference
      const savedLanguageCode = getFromLocalStorage(LANGUAGE_STORAGE_KEY, null);

      // Use utility function to determine best language
      const { language: targetLanguage, reason, warning } = selectBestLanguage(
        availableLanguages,
        savedLanguageCode
      );

      // Handle warnings (like invalid saved language)
      if (warning) {
        console.warn(warning);
        if (reason === 'saved' && savedLanguageCode) {
          // Clear invalid saved language from localStorage
          removeFromLocalStorage(LANGUAGE_STORAGE_KEY);

          // Retry selection without saved language
          const { language: retryLanguage, reason: retryReason } = selectBestLanguage(
            availableLanguages,
            null
          );

          if (retryLanguage) {
            console.log(`Retrying language selection: Using ${retryReason} language: ${retryLanguage.name}`);
            await changeLanguage(retryLanguage.code);
          }
          return;
        }
      }

      // Log the selection reason
      if (targetLanguage) {
        const reasonMessages: Record<typeof reason, string> = {
          environment: `environment default language: ${targetLanguage.name} (${targetLanguage.code})`,
          saved: `saved language preference: ${targetLanguage.name} (${targetLanguage.code})`,
          api_default: `API default language: ${targetLanguage.name} (${targetLanguage.code})`,
          first_available: `first available language: ${targetLanguage.name} (${targetLanguage.code})`,
          none_available: `no language available: ${targetLanguage.name} (${targetLanguage.code})`
        };

        console.log(`Using ${reasonMessages[reason]}`);

        // Change language if it's different from current
        if (!currentLanguage || currentLanguage.code !== targetLanguage.code) {
          await changeLanguage(targetLanguage.code);
        }
      } else {
        throw new Error('No suitable language found');
      }
    } catch (error) {
      console.error('Failed to initialize language:', error);
      dispatch(setError('Failed to initialize language'));

      // Try to set the first available language as fallback
      if (availableLanguages.length > 0 && !currentLanguage) {
        const fallbackLanguage = availableLanguages[0];
        console.log(`Setting fallback language: ${fallbackLanguage.name}`);
        dispatch(setCurrentLanguage(fallbackLanguage));
      }
    }
  }, [availableLanguages, currentLanguage, changeLanguage, dispatch]);

  /**
   * Initialize language when available languages are loaded
   */
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  /**
   * Load translations for current language if not already loaded
   */
  useEffect(() => {
    if (currentLanguage && !translations[currentLanguage.code]) {
      loadLanguageTranslations(currentLanguage.code);
    }
  }, [currentLanguage, translations, loadLanguageTranslations]);

  /**
   * Initialize and update document direction when current language changes
   */
  useEffect(() => {
    if (currentLanguage) {
      updateDirection(currentLanguage);
    }
  }, [currentLanguage]);

  /**
   * Initialize direction on component mount and cleanup on unmount
   */
  useEffect(() => {
    const cleanup = initializeDirection(currentLanguage);
    return cleanup;
  }, []);

  // Context value
  const contextValue: LocalizationContextType = {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    t: () => '', // This will be implemented in the useTranslation hook
    isRTL: currentLanguage?.rtl || false,
    isLoading
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};

/**
 * Hook to access the localization context
 * @returns LocalizationContextType
 */
export const useLocalizationContext = () => {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalizationContext must be used within a LocalizationProvider');
  }

  return context;
};
import { useSelector } from 'react-redux';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import { getTranslation } from '../utils/translationUtils';
import type { RootState } from '../store';
import type { UseTranslationReturn, TranslationNamespace } from '../types/localization';

/**
 * Custom hook for accessing translation functionality
 * Provides t() function for component translations with fallback logic
 * @returns Translation function and language information
 */
export function useTranslation(): UseTranslationReturn {
    const context = useLocalizationContext();
    const translations = useSelector((state: RootState) => state.localization.translations);

    const {
        currentLanguage,
        changeLanguage,
        isLoading
    } = context;

    /**
     * Translation function with parameter substitution and comprehensive fallback logic
     * @param key - Dot-notation translation key (e.g., "common.buttons.save")
     * @param params - Optional parameters for interpolation
     * @returns Translated string with parameters interpolated
     */
    const t = (key: string, params?: Record<string, string | number>): string => {
        // Validate input
        if (!key || typeof key !== 'string') {
            console.warn('Translation key must be a non-empty string');
            return '[INVALID_KEY]';
        }

        // If no current language, try to provide a reasonable fallback
        if (!currentLanguage) {
            console.warn('No current language set, using key as fallback');
            return key.split('.').pop() || key;
        }

        // If no translations loaded for current language, try fallbacks
        if (!translations[currentLanguage.code]) {
            console.warn(`No translations loaded for language: ${currentLanguage.code}`);
            
            // Try English fallback if available
            if (currentLanguage.code !== 'en' && translations['en']) {
                const englishTranslations = translations['en'] as TranslationNamespace;
                const englishTranslation = getTranslation(englishTranslations, key, params);
                
                if (!englishTranslation.startsWith('[MISSING:')) {
                    console.warn(`Using English fallback for unavailable language: ${key} (${currentLanguage.code})`);
                    return englishTranslation;
                }
            }
            
            // Final fallback: use the last part of the key
            const fallbackText = key.split('.').pop() || key;
            return fallbackText.charAt(0).toUpperCase() + fallbackText.slice(1);
        }

        const languageTranslations = translations[currentLanguage.code] as TranslationNamespace;

        // Try to get translation for current language
        const translation = getTranslation(languageTranslations, key, params);

        // If translation not found and not already a fallback, try English as fallback
        if (translation.startsWith('[MISSING:') && currentLanguage.code !== 'en') {
            const englishTranslations = translations['en'] as TranslationNamespace;

            if (englishTranslations) {
                const englishTranslation = getTranslation(englishTranslations, key, params);

                if (!englishTranslation.startsWith('[MISSING:')) {
                    console.warn(`Using English fallback for missing translation: ${key} (${currentLanguage.code})`);
                    return englishTranslation;
                }
            }
            
            // If English fallback also fails, use key-based fallback
            const keyFallback = key.split('.').pop() || key;
            console.warn(`Using key-based fallback for missing translation: ${key}`);
            return keyFallback.charAt(0).toUpperCase() + keyFallback.slice(1);
        }

        return translation;
    };

    /**
     * Check if current language uses RTL (right-to-left) text direction
     */
    const isRTL = currentLanguage?.rtl || false;

    return {
        t,
        currentLanguage,
        isRTL,
        changeLanguage,
        isLoading
    };
}

/**
 * Hook for accessing only the translation function (lighter alternative)
 * @returns Just the translation function
 */
export function useT() {
    const { t } = useTranslation();
    return t;
}

/**
 * Hook for accessing language information without translation function
 * @returns Language state and controls
 */
export function useLanguage() {
    const { currentLanguage, isRTL, changeLanguage, isLoading } = useTranslation();

    return {
        currentLanguage,
        isRTL,
        changeLanguage,
        isLoading
    };
}
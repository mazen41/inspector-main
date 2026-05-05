/**
 * Translation loading utilities for dynamic import and key resolution
 */

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

export interface TranslationNamespace {
  [namespace: string]: TranslationKeys;
}

/**
 * Available translation namespaces
 */
export const TRANSLATION_NAMESPACES = [
  'common',
  'navigation',
  'dashboard',
  'inspections',
  'payments',
  'profile',
  'forms',
  'errors',
  'auth'
] as const;

export type TranslationNamespaceType = typeof TRANSLATION_NAMESPACES[number];

/**
 * Dynamically import translation JSON files for a specific language
 * @param languageCode - Language code (e.g., 'en', 'ar')
 * @returns Promise resolving to all translation namespaces for the language
 */
export async function loadTranslations(languageCode: string): Promise<TranslationNamespace> {
  const translations: TranslationNamespace = {};
  const failedNamespaces: string[] = [];
  
  try {
    // Load all translation namespaces for the specified language
    const loadPromises = TRANSLATION_NAMESPACES.map(async (namespace) => {
      try {
        const module = await import(`../locales/${languageCode}/${namespace}.json`);
        translations[namespace] = module.default || module;
      } catch (error) {
        console.warn(`Failed to load translation namespace '${namespace}' for language '${languageCode}':`, error);
        failedNamespaces.push(namespace);
        
        // Try to load English fallback for this namespace
        if (languageCode !== 'en') {
          try {
            const fallbackModule = await import(`../locales/en/${namespace}.json`);
            translations[namespace] = fallbackModule.default || fallbackModule;
            console.log(`Using English fallback for namespace '${namespace}' in language '${languageCode}'`);
          } catch (fallbackError) {
            console.error(`Failed to load English fallback for namespace '${namespace}':`, fallbackError);
            // Set empty object as final fallback
            translations[namespace] = {};
          }
        } else {
          // Set empty object as fallback for English
          translations[namespace] = {};
        }
      }
    });

    await Promise.all(loadPromises);
    
    // Check if we have at least some translations loaded
    const loadedNamespaces = Object.keys(translations).filter(ns => 
      Object.keys(translations[ns]).length > 0
    );
    
    if (loadedNamespaces.length === 0) {
      throw new Error(`No translations could be loaded for language: ${languageCode}`);
    }
    
    if (failedNamespaces.length > 0) {
      console.warn(`Partially loaded translations for language '${languageCode}'. Failed namespaces: ${failedNamespaces.join(', ')}`);
    } else {
      console.log(`Successfully loaded all translations for language: ${languageCode}`);
    }
    
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for language '${languageCode}':`, error);
    
    // If this is not English, try to load English as complete fallback
    if (languageCode !== 'en') {
      console.log(`Attempting to load English translations as fallback for '${languageCode}'`);
      try {
        return await loadTranslations('en');
      } catch (englishError) {
        console.error('Failed to load English fallback translations:', englishError);
      }
    }
    
    throw new Error(`Translation loading failed for language: ${languageCode}. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resolve translation key using dot notation (e.g., "common.buttons.save")
 * @param translations - Translation namespace object
 * @param key - Dot-notation key to resolve
 * @returns Resolved translation string or null if not found
 */
export function resolveTranslationKey(
  translations: TranslationNamespace,
  key: string
): string | null {
  if (!key || typeof key !== 'string') {
    return null;
  }

  const keyParts = key.split('.');
  
  if (keyParts.length < 2) {
    console.warn(`Invalid translation key format: '${key}'. Expected format: 'namespace.key'`);
    return null;
  }

  const [namespace, ...pathParts] = keyParts;
  
  // Check if namespace exists
  if (!translations[namespace]) {
    console.warn(`Translation namespace '${namespace}' not found for key: '${key}'`);
    return null;
  }

  // Navigate through the nested object structure
  let current: any = translations[namespace];
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Translation key '${key}' not found in namespace '${namespace}'`);
      return null;
    }
  }

  // Ensure we have a string value
  if (typeof current === 'string') {
    return current;
  }

  console.warn(`Translation key '${key}' does not resolve to a string value`);
  return null;
}

/**
 * Interpolate parameters in translation strings
 * Supports {{paramName}} syntax for parameter substitution
 * @param template - Translation string with parameter placeholders
 * @param params - Object containing parameter values
 * @returns String with parameters interpolated
 */
export function interpolateTranslation(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params || Object.keys(params).length === 0) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
    const value = params[paramName];
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    console.warn(`Parameter '${paramName}' not found for translation template: '${template}'`);
    return match; // Return original placeholder if parameter not found
  });
}

/**
 * Get translation with key resolution and parameter interpolation
 * @param translations - Translation namespace object
 * @param key - Dot-notation translation key
 * @param params - Optional parameters for interpolation
 * @param fallback - Optional fallback text if translation not found
 * @returns Translated and interpolated string
 */
export function getTranslation(
  translations: TranslationNamespace,
  key: string,
  params?: Record<string, string | number>,
  fallback?: string
): string {
  const resolvedTranslation = resolveTranslationKey(translations, key);
  
  if (resolvedTranslation) {
    return interpolateTranslation(resolvedTranslation, params);
  }

  // Return fallback or formatted missing key indicator
  if (fallback) {
    return interpolateTranslation(fallback, params);
  }

  return `[MISSING: ${key}]`;
}

/**
 * Validate that all required translation keys exist for a language
 * @param translations - Translation namespace object to validate
 * @param requiredKeys - Array of required translation keys
 * @returns Object with validation results
 */
export function validateTranslations(
  translations: TranslationNamespace,
  requiredKeys: string[]
): {
  isValid: boolean;
  missingKeys: string[];
  emptyKeys: string[];
} {
  const missingKeys: string[] = [];
  const emptyKeys: string[] = [];

  for (const key of requiredKeys) {
    const translation = resolveTranslationKey(translations, key);
    
    if (translation === null) {
      missingKeys.push(key);
    } else if (translation.trim() === '') {
      emptyKeys.push(key);
    }
  }

  return {
    isValid: missingKeys.length === 0 && emptyKeys.length === 0,
    missingKeys,
    emptyKeys
  };
}

/**
 * Get all available translation keys from a namespace (for development/debugging)
 * @param translations - Translation namespace object
 * @param namespace - Specific namespace to extract keys from
 * @returns Array of all available keys in dot notation
 */
export function getAvailableKeys(
  translations: TranslationNamespace,
  namespace?: string
): string[] {
  const keys: string[] = [];
  
  const namespacesToProcess = namespace 
    ? [namespace] 
    : Object.keys(translations);

  function extractKeys(obj: any, prefix: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        keys.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        extractKeys(value, fullKey);
      }
    }
  }

  for (const ns of namespacesToProcess) {
    if (translations[ns]) {
      extractKeys(translations[ns], ns);
    }
  }

  return keys.sort();
}
/*
*
 * Create emergency fallback translations for critical UI elements
 * Used when all translation loading fails
 */
export function createEmergencyFallbackTranslations(): TranslationNamespace {
  return {
    common: {
      buttons: {
        save: 'Save',
        cancel: 'Cancel',
        retry: 'Try Again',
        close: 'Close',
        ok: 'OK',
        yes: 'Yes',
        no: 'No'
      },
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    },
    navigation: {
      dashboard: 'Dashboard',
      inspections: 'Inspections',
      payments: 'Payments',
      profile: 'Profile'
    },
    errors: {
      generic: 'An error occurred',
      network: 'Network error',
      notFound: 'Not found',
      unauthorized: 'Unauthorized',
      serverError: 'Server error',
      translationError: 'Translation error - using fallback text'
    }
  };
}

/**
 * Determine the best language to use based on priority:
 * 1. Environment variable (VITE_DEFAULT_LANGUAGE)
 * 2. Saved user preference (localStorage)
 * 3. API default language (is_default: true)
 * 4. First available language
 * 
 * @param availableLanguages - Languages available from API
 * @param savedLanguageCode - Language code saved in localStorage
 * @returns Object with selected language and reason for selection
 */
export function selectBestLanguage<T extends { code: string; name: string; is_default?: boolean }>(
  availableLanguages: T[],
  savedLanguageCode: string | null
): {
  language: T | null;
  reason: 'environment' | 'saved' | 'api_default' | 'first_available' | 'none_available';
  warning?: string;
} {
  if (availableLanguages.length === 0) {
    return {
      language: null,
      reason: 'none_available',
      warning: 'No languages available from API'
    };
  }

  // 1. Check environment variable first
  const envDefaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE;
  if (envDefaultLanguage) {
    const envLanguage = availableLanguages.find(lang => lang.code === envDefaultLanguage);
    if (envLanguage) {
      return {
        language: envLanguage,
        reason: 'environment'
      };
    } else {
      console.warn(`Environment default language '${envDefaultLanguage}' not found in available languages from API`);
    }
  }

  // 2. Check saved preference
  if (savedLanguageCode) {
    const savedLanguage = availableLanguages.find(lang => lang.code === savedLanguageCode);
    if (savedLanguage) {
      return {
        language: savedLanguage,
        reason: 'saved'
      };
    } else {
      return {
        language: null,
        reason: 'saved',
        warning: `Saved language '${savedLanguageCode}' not found in available languages`
      };
    }
  }

  // 3. Check API default
  const apiDefaultLanguage = availableLanguages.find(lang => lang.is_default);
  if (apiDefaultLanguage) {
    return {
      language: apiDefaultLanguage,
      reason: 'api_default'
    };
  }

  // 4. Use first available
  return {
    language: availableLanguages[0],
    reason: 'first_available'
  };
}

/**
 * Enhanced translation loading with comprehensive error handling
 * @param languageCode - Language code to load
 * @returns Promise with translations or emergency fallback
 */
export async function loadTranslationsWithFallback(languageCode: string): Promise<{
  translations: TranslationNamespace;
  hasErrors: boolean;
  errorDetails?: string[];
}> {
  const errorDetails: string[] = [];
  
  try {
    const translations = await loadTranslations(languageCode);
    return { translations, hasErrors: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown translation loading error';
    errorDetails.push(errorMessage);
    
    console.error(`Primary translation loading failed for '${languageCode}':`, error);
    
    // Try English fallback if not already English
    if (languageCode !== 'en') {
      try {
        console.log('Attempting English fallback...');
        const englishTranslations = await loadTranslations('en');
        errorDetails.push(`Using English fallback for language '${languageCode}'`);
        return { 
          translations: englishTranslations, 
          hasErrors: true, 
          errorDetails 
        };
      } catch (englishError) {
        const englishErrorMessage = englishError instanceof Error ? englishError.message : 'Unknown English fallback error';
        errorDetails.push(`English fallback failed: ${englishErrorMessage}`);
        console.error('English fallback also failed:', englishError);
      }
    }
    
    // Use emergency fallback as last resort
    console.warn('Using emergency fallback translations');
    errorDetails.push('Using emergency fallback translations');
    
    return {
      translations: createEmergencyFallbackTranslations(),
      hasErrors: true,
      errorDetails
    };
  }
}

/**
 * Validate translation completeness and report issues
 * @param translations - Translations to validate
 * @param languageCode - Language code being validated
 * @returns Validation report
 */
export function validateTranslationCompleteness(
  translations: TranslationNamespace,
  languageCode: string
): {
  isComplete: boolean;
  missingNamespaces: string[];
  emptyNamespaces: string[];
  totalKeys: number;
  issues: string[];
} {
  const missingNamespaces: string[] = [];
  const emptyNamespaces: string[] = [];
  const issues: string[] = [];
  let totalKeys = 0;
  
  // Check each expected namespace
  for (const namespace of TRANSLATION_NAMESPACES) {
    if (!translations[namespace]) {
      missingNamespaces.push(namespace);
      issues.push(`Missing namespace: ${namespace}`);
    } else {
      const keys = getAvailableKeys(translations, namespace);
      totalKeys += keys.length;
      
      if (keys.length === 0) {
        emptyNamespaces.push(namespace);
        issues.push(`Empty namespace: ${namespace}`);
      }
    }
  }
  
  const isComplete = missingNamespaces.length === 0 && emptyNamespaces.length === 0;
  
  if (!isComplete) {
    console.warn(`Translation validation failed for '${languageCode}':`, {
      missingNamespaces,
      emptyNamespaces,
      totalKeys,
      issues
    });
  }
  
  return {
    isComplete,
    missingNamespaces,
    emptyNamespaces,
    totalKeys,
    issues
  };
}
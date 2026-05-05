/**
 * Utility functions for locale-aware date and number formatting
 */

import type { Language } from '../types/localization';

/**
 * Get the appropriate locale string for formatting based on language
 * @param language - The current language object
 * @returns Locale string for Intl formatters
 */
const getLocaleString = (language: Language | null): string => {
  if (!language) {
    return 'en-US'; // Default fallback
  }

  // Map language codes to appropriate locales
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'ar': 'ar-SA', // Arabic (Saudi Arabia) - commonly used for Arabic formatting
    'ar-SA': 'ar-SA',
    'ar-AE': 'ar-AE',
    'ar-EG': 'ar-EG',
  };

  return localeMap[language.code] || localeMap[language.code.split('-')[0]] || 'en-US';
};

/**
 * Format a date according to the current language locale
 * @param date - The date to format
 * @param language - The current language object
 * @param options - Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  language: Language | null,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    // Handle null/undefined dates
    if (date === null || date === undefined) {
      return '-';
    }

    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return String(date);
    }

    const locale = getLocaleString(language);
    
    // Default options for date formatting
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Format a date and time according to the current language locale
 * @param date - The date to format
 * @param language - The current language object
 * @param options - Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string | number | null | undefined,
  language: Language | null,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return formatDate(date, language, defaultOptions);
};

/**
 * Format a time according to the current language locale
 * @param date - The date to format (time portion will be used)
 * @param language - The current language object
 * @param options - Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string | number | null | undefined,
  language: Language | null,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return formatDate(date, language, defaultOptions);
};

/**
 * Format a number according to the current language locale
 * @param number - The number to format
 * @param language - The current language object
 * @param options - Intl.NumberFormatOptions for customizing the format
 * @returns Formatted number string
 */
export const formatNumber = (
  number: number,
  language: Language | null,
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    if (typeof number !== 'number' || isNaN(number)) {
      console.warn('Invalid number provided to formatNumber:', number);
      return String(number);
    }

    const locale = getLocaleString(language);
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(number);
  }
};

/**
 * Format a currency amount according to the current language locale
 * @param amount - The amount to format
 * @param language - The current language object
 * @param currency - The currency code (e.g., 'USD', 'SAR', 'AED')
 * @param options - Additional Intl.NumberFormatOptions
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  language: Language | null,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string => {
  const currencyOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    ...options
  };

  return formatNumber(amount, language, currencyOptions);
};

/**
 * Format a percentage according to the current language locale
 * @param value - The decimal value to format as percentage (e.g., 0.15 for 15%)
 * @param language - The current language object
 * @param options - Additional Intl.NumberFormatOptions
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  language: Language | null,
  options: Intl.NumberFormatOptions = {}
): string => {
  const percentageOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };

  return formatNumber(value, language, percentageOptions);
};

/**
 * Format a large number with compact notation (e.g., 1.2K, 1.5M)
 * @param number - The number to format
 * @param language - The current language object
 * @param options - Additional Intl.NumberFormatOptions
 * @returns Formatted compact number string
 */
export const formatCompactNumber = (
  number: number,
  language: Language | null,
  options: Intl.NumberFormatOptions = {}
): string => {
  const compactOptions: Intl.NumberFormatOptions = {
    notation: 'compact',
    compactDisplay: 'short',
    ...options
  };

  return formatNumber(number, language, compactOptions);
};

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - The date to compare against now
 * @param language - The current language object
 * @param options - Intl.RelativeTimeFormatOptions
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (
  date: Date | string | number | null | undefined,
  language: Language | null,
  options: Intl.RelativeTimeFormatOptions = {}
): string => {
  try {
    // Handle null/undefined dates
    if (date === null || date === undefined) {
      return '-';
    }

    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatRelativeTime:', date);
      return String(date);
    }

    const locale = getLocaleString(language);
    const now = new Date();
    const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
      ...options
    });

    // Determine the appropriate unit and value
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) {
      return rtf.format(diffInSeconds, 'second');
    } else if (absDiff < 3600) {
      return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
    } else if (absDiff < 86400) {
      return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
    } else if (absDiff < 2592000) {
      return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
    } else if (absDiff < 31536000) {
      return rtf.format(Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return String(date);
  }
};

/**
 * Get localized month names
 * @param language - The current language object
 * @param format - 'long', 'short', or 'narrow'
 * @returns Array of localized month names
 */
export const getLocalizedMonthNames = (
  language: Language | null,
  format: 'long' | 'short' | 'narrow' = 'long'
): string[] => {
  try {
    const locale = getLocaleString(language);
    const formatter = new Intl.DateTimeFormat(locale, { month: format });
    
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2023, i, 1); // Use 2023 as a reference year
      return formatter.format(date);
    });
  } catch (error) {
    console.error('Error getting localized month names:', error);
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }
};

/**
 * Get localized day names
 * @param language - The current language object
 * @param format - 'long', 'short', or 'narrow'
 * @returns Array of localized day names (starting with Sunday)
 */
export const getLocalizedDayNames = (
  language: Language | null,
  format: 'long' | 'short' | 'narrow' = 'long'
): string[] => {
  try {
    const locale = getLocaleString(language);
    const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2023, 0, i + 1); // January 1, 2023 was a Sunday
      return formatter.format(date);
    });
  } catch (error) {
    console.error('Error getting localized day names:', error);
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }
};
/**
 * Custom hook for locale-aware formatting functions
 */

import { useCallback } from 'react';
import { useTranslation } from './useTranslation';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatRelativeTime,
  getLocalizedMonthNames,
  getLocalizedDayNames
} from '../utils/localeFormatters';

/**
 * Hook that provides locale-aware formatting functions based on current language
 * @returns Object containing formatting functions
 */
export const useLocaleFormatters = () => {
  const { currentLanguage } = useTranslation();

  // Date formatting functions
  const formatDateLocale = useCallback(
    (date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, currentLanguage, options),
    [currentLanguage]
  );

  const formatDateTimeLocale = useCallback(
    (date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(date, currentLanguage, options),
    [currentLanguage]
  );

  const formatTimeLocale = useCallback(
    (date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatTime(date, currentLanguage, options),
    [currentLanguage]
  );

  const formatRelativeTimeLocale = useCallback(
    (date: Date | string | number | null | undefined, options?: Intl.RelativeTimeFormatOptions) =>
      formatRelativeTime(date, currentLanguage, options),
    [currentLanguage]
  );

  // Number formatting functions
  const formatNumberLocale = useCallback(
    (number: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(number, currentLanguage, options),
    [currentLanguage]
  );

  const formatCurrencyLocale = useCallback(
    (amount: number, currency?: string, options?: Intl.NumberFormatOptions) =>
      formatCurrency(amount, currentLanguage, currency, options),
    [currentLanguage]
  );

  const formatPercentageLocale = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      formatPercentage(value, currentLanguage, options),
    [currentLanguage]
  );

  const formatCompactNumberLocale = useCallback(
    (number: number, options?: Intl.NumberFormatOptions) =>
      formatCompactNumber(number, currentLanguage, options),
    [currentLanguage]
  );

  // Localized names functions
  const getMonthNames = useCallback(
    (format?: 'long' | 'short' | 'narrow') =>
      getLocalizedMonthNames(currentLanguage, format),
    [currentLanguage]
  );

  const getDayNames = useCallback(
    (format?: 'long' | 'short' | 'narrow') =>
      getLocalizedDayNames(currentLanguage, format),
    [currentLanguage]
  );

  return {
    // Date formatting
    formatDate: formatDateLocale,
    formatDateTime: formatDateTimeLocale,
    formatTime: formatTimeLocale,
    formatRelativeTime: formatRelativeTimeLocale,
    
    // Number formatting
    formatNumber: formatNumberLocale,
    formatCurrency: formatCurrencyLocale,
    formatPercentage: formatPercentageLocale,
    formatCompactNumber: formatCompactNumberLocale,
    
    // Localized names
    getMonthNames,
    getDayNames,
    
    // Current language info
    currentLanguage,
    isRTL: currentLanguage?.rtl || false
  };
};
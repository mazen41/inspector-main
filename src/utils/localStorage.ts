/**
 * Utility functions for safe localStorage operations
 */

/**
 * Safely get an item from localStorage
 * @param key - The localStorage key
 * @param defaultValue - Default value to return if key doesn't exist or localStorage is unavailable
 * @returns The stored value or default value
 */
export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    // Try to parse as JSON, fall back to string
    try {
      return JSON.parse(item);
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.warn(`Failed to get item from localStorage with key '${key}':`, error);
    return defaultValue;
  }
};

/**
 * Safely set an item in localStorage
 * @param key - The localStorage key
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export const setToLocalStorage = <T>(key: string, value: T): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to set item in localStorage with key '${key}':`, error);
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 * @param key - The localStorage key
 * @returns true if successful, false otherwise
 */
export const removeFromLocalStorage = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove item from localStorage with key '${key}':`, error);
    return false;
  }
};

/**
 * Check if localStorage is available
 * @returns true if localStorage is available, false otherwise
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};
import type { Language } from '../types/localization';

/**
 * Utility functions for managing text direction (RTL/LTR) based on language
 */

/**
 * Apply direction classes to the document root element
 * @param isRTL - Whether the current language uses RTL direction
 */
export function applyDirectionToDocument(isRTL: boolean): void {
  const htmlElement = document.documentElement;
  
  if (isRTL) {
    // Apply RTL direction
    htmlElement.setAttribute('dir', 'rtl');
    htmlElement.classList.add('rtl');
    htmlElement.classList.remove('ltr');
  } else {
    // Apply LTR direction
    htmlElement.setAttribute('dir', 'ltr');
    htmlElement.classList.add('ltr');
    htmlElement.classList.remove('rtl');
  }
}

/**
 * Detect if a language uses RTL (right-to-left) text direction
 * @param language - Language object with RTL property
 * @returns Boolean indicating if language is RTL
 */
export function isRTLLanguage(language: Language | null): boolean {
  return language?.rtl || false;
}

/**
 * Get direction-aware CSS classes for components
 * @param isRTL - Whether current language is RTL
 * @param baseClasses - Base CSS classes
 * @param rtlClasses - Additional classes for RTL
 * @param ltrClasses - Additional classes for LTR
 * @returns Combined CSS class string
 */
export function getDirectionClasses(
  isRTL: boolean,
  baseClasses: string = '',
  rtlClasses: string = '',
  ltrClasses: string = ''
): string {
  const directionClasses = isRTL ? rtlClasses : ltrClasses;
  return [baseClasses, directionClasses].filter(Boolean).join(' ');
}

/**
 * Get margin/padding classes using logical properties
 * @param isRTL - Whether current language is RTL
 * @param startValue - Value for inline-start (left in LTR, right in RTL)
 * @param endValue - Value for inline-end (right in LTR, left in RTL)
 * @param type - Type of spacing ('margin' or 'padding')
 * @returns CSS class string with logical properties
 */
export function getLogicalSpacingClasses(
  _isRTL: boolean,
  startValue: string,
  endValue: string = '',
  type: 'margin' | 'padding' = 'margin'
): string {
  const prefix = type === 'margin' ? 'm' : 'p';
  const startClass = `${prefix}s-${startValue}`;
  const endClass = endValue ? `${prefix}e-${endValue}` : '';
  
  return [startClass, endClass].filter(Boolean).join(' ');
}

/**
 * Get position classes for RTL/LTR layouts
 * @param isRTL - Whether current language is RTL
 * @param position - Position value (e.g., '0', '4', 'auto')
 * @param side - Which side to position ('start' or 'end')
 * @returns CSS class string for positioning
 */
export function getPositionClasses(
  isRTL: boolean,
  position: string,
  side: 'start' | 'end'
): string {
  if (side === 'start') {
    return isRTL ? `right-${position}` : `left-${position}`;
  } else {
    return isRTL ? `left-${position}` : `right-${position}`;
  }
}

/**
 * Get text alignment classes for RTL/LTR
 * @param isRTL - Whether current language is RTL
 * @param alignment - Desired alignment ('start', 'end', 'center')
 * @returns CSS class string for text alignment
 */
export function getTextAlignmentClasses(
  isRTL: boolean,
  alignment: 'start' | 'end' | 'center' = 'start'
): string {
  switch (alignment) {
    case 'start':
      return isRTL ? 'text-right' : 'text-left';
    case 'end':
      return isRTL ? 'text-left' : 'text-right';
    case 'center':
      return 'text-center';
    default:
      return isRTL ? 'text-right' : 'text-left';
  }
}

/**
 * Get flex direction classes for RTL/LTR layouts
 * @param isRTL - Whether current language is RTL
 * @param reverse - Whether to reverse the flex direction
 * @returns CSS class string for flex direction
 */
export function getFlexDirectionClasses(
  isRTL: boolean,
  reverse: boolean = false
): string {
  if (reverse) {
    return isRTL ? 'flex-row' : 'flex-row-reverse';
  } else {
    return isRTL ? 'flex-row-reverse' : 'flex-row';
  }
}

/**
 * Get border classes using logical properties
 * @param isRTL - Whether current language is RTL
 * @param side - Which side to apply border ('start' or 'end')
 * @param width - Border width (e.g., '', '2', '4')
 * @returns CSS class string for border
 */
export function getBorderClasses(
  _isRTL: boolean,
  side: 'start' | 'end',
  width: string = ''
): string {
  const widthSuffix = width ? `-${width}` : '';
  return side === 'start' ? `border-s${widthSuffix}` : `border-e${widthSuffix}`;
}

/**
 * Get rounded corner classes using logical properties
 * @param isRTL - Whether current language is RTL
 * @param side - Which side to apply rounded corners ('start' or 'end')
 * @param size - Corner size (e.g., '', 'lg', 'xl')
 * @returns CSS class string for rounded corners
 */
export function getRoundedClasses(
  _isRTL: boolean,
  side: 'start' | 'end',
  size: string = ''
): string {
  const sizeSuffix = size ? `-${size}` : '';
  return side === 'start' ? `rounded-s${sizeSuffix}` : `rounded-e${sizeSuffix}`;
}

/**
 * Initialize direction management for the application
 * Sets up initial direction based on language and provides cleanup
 * @param language - Current language object
 * @returns Cleanup function to remove direction classes
 */
export function initializeDirection(language: Language | null): () => void {
  const isRTL = isRTLLanguage(language);
  applyDirectionToDocument(isRTL);
  
  // Return cleanup function
  return () => {
    const htmlElement = document.documentElement;
    htmlElement.removeAttribute('dir');
    htmlElement.classList.remove('rtl', 'ltr');
  };
}

/**
 * Hook-like function to manage direction changes
 * Call this whenever the language changes
 * @param language - New language object
 */
export function updateDirection(language: Language | null): void {
  const isRTL = isRTLLanguage(language);
  applyDirectionToDocument(isRTL);
  
  // Announce direction change for screen readers
  const announcement = isRTL 
    ? 'Text direction changed to right-to-left' 
    : 'Text direction changed to left-to-right';
    
  // Create temporary announcement element
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = announcement;
  
  document.body.appendChild(announcer);
  
  // Remove announcement after screen readers have processed it
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}
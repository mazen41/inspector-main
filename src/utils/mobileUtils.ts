import React from 'react';

/**
 * Mobile detection and responsive utilities
 * Provides consistent mobile detection and responsive behavior across components
 */

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  hasCamera: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Detect if the current device is mobile
 */
export const detectMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth < 768;
  
  return isMobileDevice || isSmallScreen;
};

/**
 * Detect if the current device is a tablet
 */
export const detectTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isTabletDevice = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  return isTabletDevice || isMediumScreen;
};

/**
 * Detect if the device has touch capabilities
 */
export const detectTouch = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Detect if the device has camera capabilities
 */
export const detectCamera = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
};

/**
 * Get comprehensive device information
 */
export const getDeviceInfo = (): MobileDetectionResult => {
  const isMobile = detectMobile();
  const isTablet = detectTablet();
  const isDesktop = !isMobile && !isTablet;
  const hasTouch = detectTouch();
  const hasCamera = detectCamera();
  
  let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) screenSize = 'mobile';
  else if (isTablet) screenSize = 'tablet';
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    hasTouch,
    hasCamera,
    screenSize,
  };
};

/**
 * Hook for responsive device detection with window resize handling
 */
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = React.useState<MobileDetectionResult>(() => getDeviceInfo());
  
  React.useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return deviceInfo;
};

/**
 * Get responsive grid columns based on device type and item count
 */
export const getResponsiveGridColumns = (
  itemCount: number,
  deviceType: 'mobile' | 'tablet' | 'desktop'
): string => {
  if (deviceType === 'mobile') {
    return itemCount === 1 ? 'grid-cols-1' : 'grid-cols-2';
  }
  
  if (deviceType === 'tablet') {
    return 'grid-cols-3';
  }
  
  // Desktop
  if (itemCount <= 2) return 'grid-cols-2';
  if (itemCount <= 4) return 'grid-cols-4';
  return 'grid-cols-5';
};

/**
 * Get touch-friendly button size classes
 */
export const getTouchButtonSize = (isMobile: boolean, size: 'sm' | 'md' | 'lg' = 'md'): string => {
  if (!isMobile) {
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };
    return sizes[size];
  }
  
  // Mobile sizes - always touch-friendly
  const mobileSizes = {
    sm: 'px-3 py-2 text-sm min-h-[44px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };
  return mobileSizes[size];
};

/**
 * Get responsive icon size
 */
export const getResponsiveIconSize = (isMobile: boolean, size: 'sm' | 'md' | 'lg' = 'md'): string => {
  if (!isMobile) {
    const sizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };
    return sizes[size];
  }
  
  // Mobile icons - slightly larger for better visibility
  const mobileSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  return mobileSizes[size];
};

/**
 * Get responsive spacing classes
 */
export const getResponsiveSpacing = (isMobile: boolean, type: 'padding' | 'margin' | 'gap'): string => {
  const prefix = type === 'padding' ? 'p' : type === 'margin' ? 'm' : 'gap';
  
  return isMobile ? `${prefix}-3` : `${prefix}-4`;
};

/**
 * Check if device supports haptic feedback
 */
export const supportsHapticFeedback = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  // Check for vibration API (basic haptic feedback)
  return 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback if supported
 */
export const triggerHapticFeedback = (pattern: number | number[] = 50): void => {
  if (supportsHapticFeedback() && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * Get safe area insets for devices with notches
 */
export const getSafeAreaInsets = (): {
  top: string;
  bottom: string;
  left: string;
  right: string;
} => {
  if (typeof window === 'undefined' || !CSS.supports('padding', 'env(safe-area-inset-top)')) {
    return { top: '0px', bottom: '0px', left: '0px', right: '0px' };
  }
  
  return {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)',
  };
};

/**
 * Check if device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth > window.innerHeight;
};

/**
 * Get optimal photo grid layout for device
 */
export const getPhotoGridLayout = (
  photoCount: number,
  deviceInfo: MobileDetectionResult
): {
  columns: string;
  gap: string;
  aspectRatio: string;
} => {
  const { isMobile, isTablet } = deviceInfo;
  
  if (isMobile) {
    return {
      columns: photoCount === 1 ? 'grid-cols-1' : 'grid-cols-2',
      gap: 'gap-3',
      aspectRatio: 'aspect-square',
    };
  }
  
  if (isTablet) {
    return {
      columns: 'grid-cols-3',
      gap: 'gap-4',
      aspectRatio: 'aspect-square',
    };
  }
  
  // Desktop
  return {
    columns: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    gap: 'gap-4',
    aspectRatio: 'aspect-square',
  };
};

export default {
  detectMobile,
  detectTablet,
  detectTouch,
  detectCamera,
  getDeviceInfo,
  useDeviceDetection,
  getResponsiveGridColumns,
  getTouchButtonSize,
  getResponsiveIconSize,
  getResponsiveSpacing,
  supportsHapticFeedback,
  triggerHapticFeedback,
  getSafeAreaInsets,
  isLandscape,
  getPhotoGridLayout,
};
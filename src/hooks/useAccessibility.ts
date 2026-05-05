import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAccessibilityOptions {
  manageFocus?: boolean;
  trapFocus?: boolean;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const {
    manageFocus = true,
    trapFocus = false
  } = options;

  const focusTrapRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  
  // Focus management
  const focusElement = useCallback((selector: string | HTMLElement) => {
    if (!manageFocus) return;
    
    const element = typeof selector === 'string' 
      ? document.querySelector(selector) as HTMLElement
      : selector;
      
    if (element) {
      element.focus();
    }
  }, [manageFocus]);

  // Skip to main content
  const skipToMain = useCallback(() => {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
    }
  }, []);

  // Focus trap for modals
  useEffect(() => {
    if (!trapFocus || !focusTrapRef.current) return;

    const trapElement = focusTrapRef.current;
    const focusableElements = trapElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    };

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [trapFocus]);

  // Keyboard navigation helpers
  const handleArrowNavigation = useCallback((
    e: React.KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }, []);

  return {
    focusElement,
    skipToMain,
    focusTrapRef,
    handleArrowNavigation
  };
};

// Hook for responsive breakpoints
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl'>('sm');
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= 1280) {
        setBreakpoint('xl');
        setIsMobile(false);
      } else if (width >= 1024) {
        setBreakpoint('lg');
        setIsMobile(false);
      } else if (width >= 768) {
        setBreakpoint('md');
        setIsMobile(false);
      } else if (width >= 640) {
        setBreakpoint('sm');
        setIsMobile(true);
      } else {
        setBreakpoint('sm');
        setIsMobile(true);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return { breakpoint, isMobile };
};

// Hook for reduced motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
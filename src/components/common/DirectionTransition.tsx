import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from '../../hooks/useTranslation';

interface DirectionTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionDuration?: number;
}

/**
 * Component that provides smooth transitions when switching between RTL and LTR layouts
 * Handles the visual transition to prevent jarring layout shifts
 */
const DirectionTransition: React.FC<DirectionTransitionProps> = ({
  children,
  className = '',
  transitionDuration = 300
}) => {
  const { isRTL, currentLanguage } = useTranslation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousDirection, setPreviousDirection] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect direction change
    if (previousDirection !== null && previousDirection !== isRTL) {
      setIsTransitioning(true);
      
      // End transition after specified duration
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);

      return () => clearTimeout(timer);
    }
    
    setPreviousDirection(isRTL);
  }, [isRTL, previousDirection, transitionDuration]);

  return (
    <div
      className={clsx(
        'transition-all ease-in-out',
        isTransitioning && 'opacity-90 scale-[0.99]',
        className
      )}
      style={{
        transitionDuration: `${transitionDuration}ms`,
        direction: isRTL ? 'rtl' : 'ltr'
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
      lang={currentLanguage?.code}
    >
      {isTransitioning && (
        <div 
          className="fixed top-4 right-4 bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">
              Adjusting layout...
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Hook for managing direction transitions programmatically
 */
export const useDirectionTransition = (duration: number = 300) => {
  const { isRTL } = useTranslation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerTransition = React.useCallback(() => {
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return {
    isTransitioning,
    triggerTransition,
    isRTL
  };
};

/**
 * Component for animating specific elements during direction changes
 */
export const DirectionAwareElement: React.FC<{
  children: React.ReactNode;
  className?: string;
  animateOnDirectionChange?: boolean;
}> = ({ 
  children, 
  className = '', 
  animateOnDirectionChange = true 
}) => {
  const { isRTL } = useTranslation();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (animateOnDirectionChange) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isRTL, animateOnDirectionChange]);

  return (
    <div
      className={clsx(
        'transition-transform duration-300 ease-in-out',
        shouldAnimate && 'scale-[0.98] opacity-90',
        className
      )}
    >
      {children}
    </div>
  );
};

export default DirectionTransition;
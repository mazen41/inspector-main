import React, { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { ManualSaveStatus } from '@/types/form';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  useDeviceDetection, 
  getResponsiveIconSize,
  triggerHapticFeedback,
  getSafeAreaInsets,
  isLandscape
} from '@/utils/mobileUtils';

interface ManualSaveButtonProps {
  onSave: () => void;
  saveStatus: ManualSaveStatus;
  hasUnsavedChanges: boolean;
  disabled?: boolean;
  className?: string;
}

const ManualSaveButton: React.FC<ManualSaveButtonProps> = ({
  onSave,
  saveStatus,
  hasUnsavedChanges,
  disabled = false,
  className = '',
}) => {
  const {isRTL, t } = useTranslation();
  const deviceInfo = useDeviceDetection();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Handle keyboard visibility on mobile devices
  useEffect(() => {
    if (!deviceInfo.isMobile) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      
      // Detect keyboard visibility by comparing viewport height to screen height
      const keyboardThreshold = windowHeight * 0.75;
      setKeyboardVisible(viewportHeight < keyboardThreshold);
    };

    const handleOrientationChange = () => {
      setOrientation(isLandscape() ? 'landscape' : 'portrait');
    };

    // Use visual viewport API if available for better keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initial check
    handleResize();
    handleOrientationChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [deviceInfo.isMobile]);

  const getButtonContent = () => {
    const iconSize = getResponsiveIconSize(deviceInfo.isMobile, 'md');
    const spacingClass = isRTL ? 'mr-2' : 'ml-2';
    
    switch (saveStatus.status) {
      case 'saving':
        return (
          <>
            <Loader2 className={`${iconSize} animate-spin`} />
            <span className={spacingClass}>{t('forms.save.saving')}</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Check className={iconSize} />
            <span className={spacingClass}>{t('forms.save.saved')}</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className={iconSize} />
            <span className={spacingClass}>{t('forms.save.saveFailed')}</span>
          </>
        );
      default:
        return (
          <>
            <Save className={iconSize} />
            <span className={spacingClass}>{t('forms.save.save')}</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    let baseClasses = 'manual-save-button';
    
    // Add RTL direction class
    if (isRTL) {
      baseClasses += ' rtl';
    }
    
    // Add device-specific classes
    if (deviceInfo.isMobile) {
      baseClasses += ' mobile';
      
      // Add keyboard visibility class
      if (keyboardVisible) {
        baseClasses += ' keyboard-visible';
      }
      
      // Add orientation class
      baseClasses += ` ${orientation}`;
    } else if (deviceInfo.isTablet) {
      baseClasses += ' tablet';
    } else {
      baseClasses += ' desktop';
    }
    
    if (disabled || (!hasUnsavedChanges && saveStatus.status === 'idle')) {
      return `${baseClasses} disabled`;
    }

    switch (saveStatus.status) {
      case 'saving':
        return `${baseClasses} saving`;
      case 'saved':
        return `${baseClasses} saved`;
      case 'error':
        return `${baseClasses} error`;
      default:
        return `${baseClasses} enabled ${hasUnsavedChanges ? 'has-changes' : ''}`;
    }
  };

  const getAriaLabel = () => {
    if (disabled || (!hasUnsavedChanges && saveStatus.status === 'idle')) {
      return t('forms.save.noChangesToSave');
    }

    switch (saveStatus.status) {
      case 'saving':
        return t('forms.save.savingInProgress');
      case 'saved':
        return t('forms.save.changesSaved');
      case 'error':
        return `${t('forms.save.saveFailed')}. ${t('forms.save.clickToRetry')}`;
      default:
        return hasUnsavedChanges ? t('forms.save.saveChanges') : t('forms.save.noChangesToSave');
    }
  };

  const getTooltip = () => {
    if (saveStatus.error) {
      return saveStatus.error;
    }
    return getAriaLabel();
  };

  const isButtonDisabled = disabled || 
    (!hasUnsavedChanges && saveStatus.status === 'idle') || 
    saveStatus.status === 'saving';

  const handleClick = () => {
    if (!isButtonDisabled) {
      // Trigger haptic feedback on mobile devices
      if (deviceInfo.isMobile && deviceInfo.hasTouch) {
        triggerHapticFeedback(50); // Short vibration for button press
      }
      onSave();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !isButtonDisabled) {
      event.preventDefault();
      // Trigger haptic feedback on mobile devices
      if (deviceInfo.isMobile && deviceInfo.hasTouch) {
        triggerHapticFeedback(50);
      }
      onSave();
    }
  };

  // Get dynamic styles for positioning based on device and keyboard state
  const getDynamicStyles = (): React.CSSProperties => {
    const safeAreaInsets = getSafeAreaInsets();
    const styles: React.CSSProperties = {};

    if (deviceInfo.isMobile) {
      if (orientation === 'landscape') {
        // Landscape mobile: position on the appropriate side based on RTL
        styles.bottom = `max(0.75rem, ${safeAreaInsets.bottom})`;
        if (isRTL) {
          styles.left = `max(1rem, ${safeAreaInsets.left})`;
          styles.right = 'auto';
        } else {
          styles.right = `max(1rem, ${safeAreaInsets.right})`;
          styles.left = 'auto';
        }
        styles.transform = 'none';
      } else {
        // Portrait mobile: center bottom positioning
        styles.left = '50%';
        styles.right = 'auto';
        styles.transform = 'translateX(-50%)';
        
        if (keyboardVisible) {
          // Move button up when keyboard is visible
          styles.bottom = `max(1rem, calc(${safeAreaInsets.bottom} + 1rem))`;
        } else {
          styles.bottom = `max(1rem, ${safeAreaInsets.bottom})`;
        }
      }
    } else if (deviceInfo.isTablet) {
      // Tablet positioning based on RTL
      styles.bottom = `max(2rem, ${safeAreaInsets.bottom})`;
      if (isRTL) {
        styles.left = `max(2rem, ${safeAreaInsets.left})`;
        styles.right = 'auto';
      } else {
        styles.right = `max(2rem, ${safeAreaInsets.right})`;
        styles.left = 'auto';
      }
    } else {
      // Desktop positioning based on RTL
      styles.bottom = '1.5rem';
      if (isRTL) {
        styles.left = '1.5rem';
        styles.right = 'auto';
      } else {
        styles.right = '1.5rem';
        styles.left = 'auto';
      }
    }

    return styles;
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isButtonDisabled}
      className={`${getButtonStyles()} ${className}`}
      style={getDynamicStyles()}
      aria-label={getAriaLabel()}
      title={getTooltip()}
      role="button"
      tabIndex={isButtonDisabled ? -1 : 0}
    >
      {getButtonContent()}
    </button>
  );
};

export default ManualSaveButton;
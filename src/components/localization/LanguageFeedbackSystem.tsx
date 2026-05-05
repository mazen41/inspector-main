import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useLocalizationError } from '../../hooks/useLocalizationError';
import LanguageToast, { useLanguageToast } from '../common/LanguageToast';
import LanguageSwitchLoader, { LanguageSwitchOverlay } from '../common/LanguageSwitchLoader';

interface LanguageFeedbackSystemProps {
  showToasts?: boolean;
  showOverlay?: boolean;
  showInlineLoader?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

/**
 * Comprehensive feedback system for language switching operations
 * Manages toasts, overlays, and loading states for better user experience
 */
const LanguageFeedbackSystem: React.FC<LanguageFeedbackSystemProps> = ({
  showToasts = true,
  showOverlay = false,
  showInlineLoader = true,
  position = 'top-right'
}) => {
  const { currentLanguage, isLoading } = useTranslation();
  const { error, hasError } = useLocalizationError();
  const { toasts, showSuccess, showError, showLoading, hideToast } = useLanguageToast();
  
  const [, setPreviousLanguage] = useState<string | null>(null);
  const [isShowingSuccess, setIsShowingSuccess] = useState(false);
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const { previousLanguage: prevLang, newLanguage } = event.detail;
      
      if (showToasts) {
        // Hide loading toast if it exists
        if (loadingToastId) {
          hideToast(loadingToastId);
          setLoadingToastId(null);
        }
        
        // Show success toast
        showSuccess(`Language changed to ${newLanguage.name}`);
        setIsShowingSuccess(true);
        
        // Hide success state after delay
        setTimeout(() => setIsShowingSuccess(false), 2000);
      }
      
      setPreviousLanguage(prevLang?.code || null);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [showToasts, loadingToastId, hideToast, showSuccess]);

  // Handle loading state
  useEffect(() => {
    if (isLoading && showToasts && !loadingToastId) {
      const id = showLoading('Switching language...');
      setLoadingToastId(id);
    } else if (!isLoading && loadingToastId) {
      hideToast(loadingToastId);
      setLoadingToastId(null);
    }
  }, [isLoading, showToasts, loadingToastId, showLoading, hideToast]);

  // Handle errors
  useEffect(() => {
    if (hasError && error && showToasts) {
      showError(error);
    }
  }, [hasError, error, showToasts, showError]);

  return (
    <>
      {/* Toast notifications */}
      {showToasts && toasts.map(toast => (
        <LanguageToast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => hideToast(toast.id)}
          position={position}
          isRTL={currentLanguage?.rtl}
        />
      ))}

      {/* Overlay loader */}
      {showOverlay && (
        <LanguageSwitchOverlay
          isVisible={isLoading}
          targetLanguage={currentLanguage?.name}
        />
      )}

      {/* Inline loader */}
      {showInlineLoader && isLoading && (
        <div className="fixed bottom-4 left-4 z-40">
          <LanguageSwitchLoader
            isLoading={isLoading}
            isSuccess={isShowingSuccess}
            targetLanguage={currentLanguage?.name}
            size="sm"
            isRTL={currentLanguage?.rtl}
          />
        </div>
      )}
    </>
  );
};

/**
 * Hook for programmatic feedback control
 */
export const useLanguageFeedback = () => {
  const { showSuccess, showError, showLoading, hideToast } = useLanguageToast();
  const [feedbackState, setFeedbackState] = useState<{
    isLoading: boolean;
    hasSuccess: boolean;
    hasError: boolean;
    message?: string;
  }>({
    isLoading: false,
    hasSuccess: false,
    hasError: false
  });

  const startLoading = (message: string = 'Loading...') => {
    setFeedbackState({
      isLoading: true,
      hasSuccess: false,
      hasError: false,
      message
    });
    return showLoading(message);
  };

  const showSuccessFeedback = (message: string) => {
    setFeedbackState({
      isLoading: false,
      hasSuccess: true,
      hasError: false,
      message
    });
    return showSuccess(message);
  };

  const showErrorFeedback = (message: string) => {
    setFeedbackState({
      isLoading: false,
      hasSuccess: false,
      hasError: true,
      message
    });
    return showError(message);
  };

  const clearFeedback = () => {
    setFeedbackState({
      isLoading: false,
      hasSuccess: false,
      hasError: false
    });
  };

  return {
    feedbackState,
    startLoading,
    showSuccessFeedback,
    showErrorFeedback,
    clearFeedback,
    hideToast
  };
};

export default LanguageFeedbackSystem;
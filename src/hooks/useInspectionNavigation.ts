import { useState, useCallback } from 'react';
import { useNavigationBlocker } from './useNavigationBlocker';
import { FORM_SETTINGS } from '../utils/constants';

interface UseInspectionNavigationProps {
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  onConfirmNavigation?: () => void;
}

interface UseInspectionNavigationReturn {
  // Modal state
  showUnsavedModal: boolean;
  pendingNavigation: string | null;
  
  // Navigation handlers
  handleNavigation: (path: string) => void;
  handleBack: () => void;
  handleModalConfirm: () => void;
  handleModalCancel: () => void;
  
  // Navigation utilities
  navigate: (path: string | number, options?: any) => void;
  isBlocked: boolean;
}

/**
 * Custom hook to manage navigation blocking and unsaved changes modal
 * Integrates with useNavigationBlocker for browser navigation blocking
 */
export const useInspectionNavigation = ({
  hasUnsavedChanges,
  isSubmitting,
  onConfirmNavigation,
}: UseInspectionNavigationProps): UseInspectionNavigationReturn => {
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Use the existing navigation blocker hook
  const { navigate: blockedNavigate, isBlocked } = useNavigationBlocker({
    when: hasUnsavedChanges && !isSubmitting,
    message: FORM_SETTINGS.UNSAVED_CHANGES_WARNING,
  });

  // Handle programmatic navigation with unsaved changes warning
  const handleNavigation = useCallback((path: string) => {
    if (hasUnsavedChanges && !isSubmitting) {
      setPendingNavigation(path);
      setShowUnsavedModal(true);
    } else {
      blockedNavigate(path);
    }
  }, [hasUnsavedChanges, isSubmitting, blockedNavigate]);

  // Handle back button navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges && !isSubmitting) {
      setPendingNavigation('back');
      setShowUnsavedModal(true);
    } else {
      blockedNavigate(-1);
    }
  }, [hasUnsavedChanges, isSubmitting, blockedNavigate]);

  // Handle modal confirmation - proceed with navigation
  const handleModalConfirm = useCallback(() => {
    // Call the optional confirmation callback to reset form state
    if (onConfirmNavigation) {
      onConfirmNavigation();
    }
    
    if (pendingNavigation) {
      // Navigate to the pending destination
      if (pendingNavigation === 'back') {
        blockedNavigate(-1);
      } else {
        blockedNavigate(pendingNavigation);
      }
    }
    
    // Reset modal state
    setPendingNavigation(null);
    setShowUnsavedModal(false);
  }, [pendingNavigation, blockedNavigate, onConfirmNavigation]);

  // Handle modal cancellation - stay on current page
  const handleModalCancel = useCallback(() => {
    setPendingNavigation(null);
    setShowUnsavedModal(false);
  }, []);

  return {
    // Modal state
    showUnsavedModal,
    pendingNavigation,
    
    // Navigation handlers
    handleNavigation,
    handleBack,
    handleModalConfirm,
    handleModalCancel,
    
    // Navigation utilities
    navigate: blockedNavigate,
    isBlocked,
  };
};

export default useInspectionNavigation;
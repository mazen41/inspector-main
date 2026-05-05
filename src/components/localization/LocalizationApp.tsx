import React from 'react';
import LocalizationWrapper from './LocalizationWrapper';
import LanguageFeedbackSystem from './LanguageFeedbackSystem';
import DirectionTransition from '../common/DirectionTransition';

interface LocalizationAppProps {
  children: React.ReactNode;
  feedbackOptions?: {
    showToasts?: boolean;
    showOverlay?: boolean;
    showInlineLoader?: boolean;
    toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  };
}

/**
 * Complete localization app wrapper with all feedback systems enabled
 * This is the main component to wrap your entire application
 */
const LocalizationApp: React.FC<LocalizationAppProps> = ({
  children,
  feedbackOptions = {}
}) => {
  const {
    showToasts = true,
    showOverlay = false,
    showInlineLoader = true,
    toastPosition = 'top-right'
  } = feedbackOptions;

  return (
    <LocalizationWrapper>
      <DirectionTransition>
        {children}
        
        {/* Feedback system */}
        <LanguageFeedbackSystem
          showToasts={showToasts}
          showOverlay={showOverlay}
          showInlineLoader={showInlineLoader}
          position={toastPosition}
        />
      </DirectionTransition>
    </LocalizationWrapper>
  );
};

export default LocalizationApp;
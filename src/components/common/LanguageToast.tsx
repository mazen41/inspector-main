import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle, AlertTriangle, X, Globe } from 'lucide-react';

interface LanguageToastProps {
  type: 'success' | 'error' | 'loading';
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  isRTL?: boolean;
}

/**
 * Toast notification component specifically for language switching feedback
 * Provides visual confirmation and error messages for language operations
 */
const LanguageToast: React.FC<LanguageToastProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
  position = 'top-right',
  isRTL = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoClose && type !== 'loading') {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, autoCloseDelay, type]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for exit animation
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default: // top-right
        return 'top-4 right-4';
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-500'
        };
      case 'loading':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: Globe,
          iconColor: 'text-blue-500'
        };
    }
  };

  if (!isVisible) return null;

  const typeStyles = getTypeStyles();
  const Icon = typeStyles.icon;

  return (
    <div
      className={clsx(
        'fixed z-50 max-w-sm w-full transition-all duration-300 ease-in-out',
        getPositionClasses(),
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        className={clsx(
          'rounded-lg border shadow-lg p-4',
          typeStyles.bg,
          'backdrop-blur-sm'
        )}
      >
        <div className={clsx(
          'flex items-start',
          isRTL && 'flex-row-reverse'
        )}>
          <div className="flex-shrink-0">
            {type === 'loading' ? (
              <div className={clsx(
                'w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin',
                typeStyles.iconColor
              )} />
            ) : (
              <Icon className={clsx('w-5 h-5', typeStyles.iconColor)} />
            )}
          </div>
          
          <div className={clsx(
            'flex-1',
            isRTL ? 'mr-3' : 'ml-3'
          )}>
            <p className={clsx(
              'text-sm font-medium',
              typeStyles.text,
              isRTL && 'text-right'
            )}>
              {message}
            </p>
          </div>
          
          {onClose && type !== 'loading' && (
            <div className={clsx(
              'flex-shrink-0',
              isRTL ? 'mr-2' : 'ml-2'
            )}>
              <button
                onClick={handleClose}
                className={clsx(
                  'rounded-md p-1.5 transition-colors',
                  'hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  type === 'success' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                )}
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for managing language toast notifications
 */
export const useLanguageToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'loading';
    message: string;
    isVisible: boolean;
  }>>([]);

  const showToast = (type: 'success' | 'error' | 'loading', message: string) => {
    const id = Date.now().toString();
    
    setToasts(prev => [...prev, {
      id,
      type,
      message,
      isVisible: true
    }]);

    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, isVisible: false } : toast
    ));

    // Remove from array after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  const showSuccess = (message: string) => showToast('success', message);
  const showError = (message: string) => showToast('error', message);
  const showLoading = (message: string) => showToast('loading', message);

  return {
    toasts,
    showSuccess,
    showError,
    showLoading,
    hideToast
  };
};

export default LanguageToast;
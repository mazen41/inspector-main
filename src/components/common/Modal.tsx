import { useEffect, useRef, useMemo } from 'react';
import type { ReactNode, RefObject, MouseEvent } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTranslation } from '../../hooks/useTranslation';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleKey?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  initialFocus?: RefObject<HTMLElement>;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  titleKey,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocus
}: ModalProps) => {
  const { t, isRTL } = useTranslation();
  const { focusTrapRef } = useAccessibility({ trapFocus: isOpen });
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const displayTitle = useMemo(() => {
    return titleKey ? t(titleKey) : title;
  }, [titleKey, title, t]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, displayTitle, initialFocus, t]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (e: MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={displayTitle ? 'modal-title' : undefined}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-gray-500/75 transition-opacity z-40"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          ref={focusTrapRef}
          className={`
            inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl 
            transform transition-all sm:my-8 sm:align-middle sm:w-full z-50 relative
            ${sizeClasses[size]}
          `}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className={clsx(
              'flex items-start justify-between mb-4',
              isRTL && 'flex-row-reverse'
            )}>
              {displayTitle && (
                <h2
                  id="modal-title"
                  className={clsx(
                    'text-lg leading-6 font-medium text-gray-900',
                    isRTL ? 'pl-4 text-right' : 'pr-4 text-left'
                  )}
                >
                  {displayTitle}
                </h2>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                className="
                  bg-white rounded-md text-gray-400 hover:text-gray-600 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                  p-1 -m-1
                "
                onClick={onClose}
                aria-label={displayTitle ? t('common.accessibility.closeDialog', { title: displayTitle }) : t('common.accessibility.closeModal')}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="focus-trap">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
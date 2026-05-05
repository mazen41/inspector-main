import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle, Check, Save } from 'lucide-react';
import type { ManualSaveStatus } from '@/types/form';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocaleFormatters } from '@/hooks/useLocaleFormatters';

interface SaveStatusIndicatorProps {
  status: ManualSaveStatus;
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  className = '',
}) => {
  const { t } = useTranslation();
  const { formatDateTime } = useLocaleFormatters();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Show success message temporarily when status changes to 'saved'
  useEffect(() => {
    if (status.status === 'saved') {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000); // Show for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [status.status]);

  const getStatusContent = () => {
    switch (status.status) {
      case 'saving':
        return (
          <div className="save-status-indicator saving">
            <Save className="status-icon" />
            <span className="status-text">{t('forms.save.savingChanges')}</span>
          </div>
        );

      case 'saved':
        if (showSuccessMessage) {
          return (
            <div className="save-status-indicator saved fade-in">
              <Check className="status-icon" />
              <span className="status-text">{t('forms.save.changesSaved')}</span>
              {status.lastSaved && (
                <span className="status-timestamp">
                  {formatDateTime(status.lastSaved, { 
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          );
        }
        
        // Show last saved timestamp when not showing success message
        if (status.lastSaved) {
          return (
            <div className="save-status-indicator last-saved">
              <Clock className="status-icon" />
              <span className="status-text">
                {t('forms.save.lastSaved')}: {formatDateTime(status.lastSaved, { 
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          );
        }
        break;

      case 'error':
        return (
          <div className="save-status-indicator error">
            <AlertCircle className="status-icon" />
            <div className="flex flex-col">
              <span className="status-text">{t('forms.save.saveError')}</span>
              {status.error && (
                <span className="status-error-detail">{status.error}</span>
              )}
            </div>
          </div>
        );

      case 'idle':
      default:
        if (status.hasUnsavedChanges) {
          return (
            <div className="save-status-indicator unsaved-changes">
              <AlertCircle className="status-icon" />
              <span className="status-text">{t('forms.messages.unsavedChanges')}</span>
            </div>
          );
        }
        
        // Show last saved timestamp when no unsaved changes
        if (status.lastSaved) {
          return (
            <div className="save-status-indicator last-saved">
              <Clock className="status-icon" />
              <span className="status-text">
                {t('forms.save.lastSaved')}: {formatDateTime(status.lastSaved, { 
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          );
        }
        break;
    }

    return null;
  };

  const content = getStatusContent();

  if (!content) {
    return null;
  }

  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {content}
    </div>
  );
};

export default SaveStatusIndicator;
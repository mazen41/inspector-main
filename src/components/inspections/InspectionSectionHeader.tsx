import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { InspectionSection, InspectionFormState } from '../../types/inspection';
import { isFieldValueAnswered } from '../../utils/validation';

interface InspectionSectionHeaderProps {
  section: InspectionSection;
  formState: InspectionFormState;
  className?: string;
}

interface SectionProgress {
  totalFields: number;
  requiredFields: number;
  completedFields: number;
  completedRequiredFields: number;
  hasErrors: boolean;
  status: 'not-started' | 'in-progress' | 'completed' | 'error';
}

const InspectionSectionHeader: React.FC<InspectionSectionHeaderProps> = ({
  section,
  formState,
  className = '',
}) => {
  const { t } = useTranslation();
  // Calculate section progress
  const progress = React.useMemo((): SectionProgress => {
    const totalFields = section.fields.length;
    const requiredFields = section.fields.filter(field => 
      field.is_required ?? field.required ?? false
    ).length;

    let completedFields = 0;
    let completedRequiredFields = 0;
    let hasErrors = false;

    section.fields.forEach(field => {
      const fieldState = formState.fields[field.id];
      const isRequired = field.is_required ?? field.required ?? false;
      
      if (fieldState?.error) {
        hasErrors = true;
      }

      // Check if field has a meaningful value
      const hasAnswered = fieldState ? isFieldValueAnswered(fieldState.value) : false;

      if (hasAnswered) {
        completedFields++;
        if (isRequired) {
          completedRequiredFields++;
        }
      }
    });

    // Determine status
    let status: SectionProgress['status'] = 'not-started';
    
    if (hasErrors) {
      status = 'error';
    } else if (completedRequiredFields === requiredFields && requiredFields > 0) {
      status = 'completed';
    } else if (completedFields > 0) {
      status = 'in-progress';
    }

    return {
      totalFields,
      requiredFields,
      completedFields,
      completedRequiredFields,
      hasErrors,
      status,
    };
  }, [section.fields, formState.fields]);

  // Get status icon and colors
  const getStatusDisplay = () => {
    switch (progress.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          statusText: t('inspections.form.section.complete'),
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          statusText: t('inspections.form.section.needsAttention'),
        };
      case 'in-progress':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          statusText: t('inspections.form.section.inProgress'),
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-400" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          statusText: t('inspections.form.section.notStarted'),
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Calculate completion percentage for required fields
  const completionPercentage = progress.requiredFields > 0 
    ? Math.round((progress.completedRequiredFields / progress.requiredFields) * 100)
    : 100;

  return (
    <div 
      className={`section-header ${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 ${className}`}
      data-section-id={section.id}
      data-testid={`section-header-${section.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {statusDisplay.icon}
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {section.name}
              </h3>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.textColor} bg-white border self-start sm:self-auto`}>
              {statusDisplay.statusText}
            </span>
          </div>

          {section.description && (
            <p className="text-sm text-gray-600 mb-3 break-words">
              {section.description}
            </p>
          )}

          {/* Progress indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
            {/* Required fields progress */}
            {progress.requiredFields > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs sm:text-sm">{t('inspections.form.section.required')}:</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 sm:w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        progress.status === 'completed' ? 'bg-green-500' :
                        progress.status === 'error' ? 'bg-red-500' :
                        progress.status === 'in-progress' ? 'bg-amber-500' :
                        'bg-gray-300'
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className={`font-medium text-xs sm:text-sm ${statusDisplay.textColor}`}>
                    {progress.completedRequiredFields}/{progress.requiredFields}
                  </span>
                </div>
              </div>
            )}

            {/* Total fields progress */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">{t('inspections.form.section.total')}:</span>
              <span className="font-medium text-gray-700 text-xs sm:text-sm">
                {progress.completedFields}/{progress.totalFields}
              </span>
            </div>

            {/* Error indicator */}
            {progress.hasErrors && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium text-xs sm:text-sm">{t('inspections.form.section.hasErrors')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Completion percentage badge */}
        {progress.requiredFields > 0 && (
          <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex-shrink-0 ${
            progress.status === 'completed' ? 'border-green-500 bg-green-100' :
            progress.status === 'error' ? 'border-red-500 bg-red-100' :
            progress.status === 'in-progress' ? 'border-amber-500 bg-amber-100' :
            'border-gray-300 bg-gray-100'
          }`}>
            <span className={`text-xs sm:text-sm font-bold ${
              progress.status === 'completed' ? 'text-green-700' :
              progress.status === 'error' ? 'text-red-700' :
              progress.status === 'in-progress' ? 'text-amber-700' :
              'text-gray-600'
            }`}>
              {completionPercentage}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionSectionHeader;
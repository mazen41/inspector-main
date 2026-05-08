import React from 'react';
import { CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { InspectionSection, InspectionFormState } from '../../types/inspection';
import { isFieldValueAnswered } from '../../utils/validation';

interface InspectionFormProgressProps {
  sections: InspectionSection[];
  formState: InspectionFormState;
  className?: string;
  forceArabic?: boolean;
}

interface FormProgress {
  totalSections: number;
  completedSections: number;
  sectionsWithErrors: number;
  totalRequiredFields: number;
  completedRequiredFields: number;
  overallStatus: 'not-started' | 'in-progress' | 'completed' | 'error';
  sectionStatuses: Record<number, 'not-started' | 'in-progress' | 'completed' | 'error'>;
}

const InspectionFormProgress: React.FC<InspectionFormProgressProps> = ({
  sections,
  formState,
  className = '',
  forceArabic = false,
}) => {
  const { t } = useTranslation();
  // Calculate overall form progress
  const progress = React.useMemo((): FormProgress => {
    let totalRequiredFields = 0;
    let completedRequiredFields = 0;
    let completedSections = 0;
    let sectionsWithErrors = 0;
    const sectionStatuses: Record<number, 'not-started' | 'in-progress' | 'completed' | 'error'> = {};

    sections.forEach(section => {
      const sectionRequiredFields = section.fields.filter(field => 
        field.is_required ?? field.required ?? false
      );
      
      let sectionCompletedRequired = 0;
      let sectionHasErrors = false;
      let sectionHasValues = false;

      section.fields.forEach(field => {
        const fieldState = formState.fields[field.id];
        const isRequired = field.is_required ?? field.required ?? false;
        
        if (fieldState?.error) {
          sectionHasErrors = true;
        }

        const hasAnswered = fieldState ? isFieldValueAnswered(fieldState.value) : false;

        if (hasAnswered) {
          sectionHasValues = true;
          if (isRequired) {
            sectionCompletedRequired++;
          }
        }
      });

      totalRequiredFields += sectionRequiredFields.length;
      completedRequiredFields += sectionCompletedRequired;

      // Determine section status
      let sectionStatus: 'not-started' | 'in-progress' | 'completed' | 'error' = 'not-started';
      
      if (sectionHasErrors) {
        sectionStatus = 'error';
        sectionsWithErrors++;
      } else if (sectionCompletedRequired === sectionRequiredFields.length && sectionRequiredFields.length > 0) {
        sectionStatus = 'completed';
        completedSections++;
      } else if (sectionHasValues) {
        sectionStatus = 'in-progress';
      }

      sectionStatuses[section.id] = sectionStatus;
    });

    // Determine overall status
    let overallStatus: FormProgress['overallStatus'] = 'not-started';
    
    if (sectionsWithErrors > 0) {
      overallStatus = 'error';
    } else if (completedSections === sections.length && sections.length > 0) {
      overallStatus = 'completed';
    } else if (completedRequiredFields > 0) {
      overallStatus = 'in-progress';
    }

    return {
      totalSections: sections.length,
      completedSections,
      sectionsWithErrors,
      totalRequiredFields,
      completedRequiredFields,
      overallStatus,
      sectionStatuses,
    };
  }, [sections, formState.fields]);

  // Calculate completion percentage
  const completionPercentage = progress.totalRequiredFields > 0 
    ? Math.round((progress.completedRequiredFields / progress.totalRequiredFields) * 100)
    : 100;

  // Get status display
  const getStatusDisplay = () => {
    switch (progress.overallStatus) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          statusText: forceArabic ? 'النموذج مكتمل' : t('inspections.form.status.formComplete'),
          progressColor: 'bg-green-500',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          statusText: forceArabic ? 'يحتاج إلى مراجعة' : t('inspections.form.status.needsAttention'),
          progressColor: 'bg-red-500',
        };
      case 'in-progress':
        return {
          icon: <Clock className="h-6 w-6 text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          statusText: forceArabic ? 'قيد الإكمال' : t('inspections.form.status.inProgress'),
          progressColor: 'bg-amber-500',
        };
      default:
        return {
          icon: <FileText className="h-6 w-6 text-gray-400" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          statusText: forceArabic ? 'لم يبدأ بعد' : t('inspections.form.status.notStarted'),
          progressColor: 'bg-gray-300',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div 
      className={`form-progress ${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 ${className}`}
      data-testid="inspection-form-progress"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            {statusDisplay.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {forceArabic ? 'تقدم الفحص' : t('inspections.form.progress.title')}
            </h2>
            <p className={`text-sm ${statusDisplay.textColor} font-medium`}>
              {statusDisplay.statusText}
            </p>
          </div>
        </div>

        {/* Overall completion percentage */}
        <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 flex-shrink-0 ${
          progress.overallStatus === 'completed' ? 'border-green-500 bg-green-100' :
          progress.overallStatus === 'error' ? 'border-red-500 bg-red-100' :
          progress.overallStatus === 'in-progress' ? 'border-amber-500 bg-amber-100' :
          'border-gray-300 bg-gray-100'
        }`}>
          <span className={`text-sm sm:text-lg font-bold ${
            progress.overallStatus === 'completed' ? 'text-green-700' :
            progress.overallStatus === 'error' ? 'text-red-700' :
            progress.overallStatus === 'in-progress' ? 'text-amber-700' :
            'text-gray-600'
          }`}>
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2">
          <span className="truncate">{forceArabic ? 'تقدم الحقول المطلوبة' : t('inspections.form.progress.requiredFieldsProgress')}</span>
          <span className="text-right sm:text-left">{forceArabic ? `${progress.completedRequiredFields} من ${progress.totalRequiredFields} مكتمل` : t('inspections.form.progress.completedOf', { 
            completed: progress.completedRequiredFields, 
            total: progress.totalRequiredFields 
          })}</span>
        </div>
        <div className="w-full h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${statusDisplay.progressColor}`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Section summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          <span className="text-gray-600 truncate">{forceArabic ? 'الأقسام المكتملة' : t('inspections.form.progress.completedSections')}:</span>
          <span className="font-semibold text-green-700">
            {progress.completedSections}/{progress.totalSections}
          </span>
        </div>

        {progress.sectionsWithErrors > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
            <span className="text-gray-600 truncate">{forceArabic ? 'أقسام بها أخطاء' : t('inspections.form.progress.sectionsWithErrors')}:</span>
            <span className="font-semibold text-red-700">
              {progress.sectionsWithErrors}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
          <span className="text-gray-600 truncate">{forceArabic ? 'قيد الإكمال' : t('inspections.form.progress.inProgress')}:</span>
          <span className="font-semibold text-amber-700">
            {progress.totalSections - progress.completedSections - (progress.sectionsWithErrors > 0 ? progress.sectionsWithErrors : 0)}
          </span>
        </div>
      </div>

      {/* Section status indicators */}
      {sections.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">{forceArabic ? 'حالة الأقسام' : t('inspections.form.progress.sectionStatus')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sections.map(section => {
              const sectionStatus = progress.sectionStatuses[section.id];
              const sectionIcon = {
                'completed': <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />,
                'error': <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />,
                'in-progress': <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />,
                'not-started': <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />,
              }[sectionStatus];

              return (
                <div key={section.id} className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  {sectionIcon}
                  <span className="text-gray-700 truncate" title={section.name}>
                    {section.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionFormProgress;

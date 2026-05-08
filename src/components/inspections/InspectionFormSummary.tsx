import React from 'react';
import { CheckCircle, AlertCircle, Clock, FileText, User, Car } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Inspection, InspectionFormState } from '../../types/inspection';
import { isFieldValueAnswered } from '../../utils/validation';

interface InspectionFormSummaryProps {
  inspection: Inspection;
  formState: InspectionFormState;
  className?: string;
}

const InspectionFormSummary: React.FC<InspectionFormSummaryProps> = ({
  inspection,
  formState,
  className = '',
}) => {
  const { t } = useTranslation();
  // Calculate summary statistics
  const summary = React.useMemo(() => {
    const sections = inspection.sections || [];
    let totalFields = 0;
    let requiredFields = 0;
    let completedFields = 0;
    let completedRequiredFields = 0;
    let fieldsWithErrors = 0;
    let fieldsWithNotes = 0;

    sections.forEach(section => {
      section.fields.forEach(field => {
        totalFields++;
        const isRequired = field.is_required ?? field.required ?? false;
        if (isRequired) requiredFields++;

        const fieldState = formState.fields[field.id];
        
        if (fieldState?.error) {
          fieldsWithErrors++;
        }

        const hasAnswered = fieldState ? isFieldValueAnswered(fieldState.value) : false;

        if (hasAnswered) {
          completedFields++;
          if (isRequired) {
            completedRequiredFields++;
          }
        }

        // Check for notes (assuming notes are passed separately)
        if (field.notes) {
          fieldsWithNotes++;
        }
      });
    });

    const completionPercentage = requiredFields > 0 
      ? Math.round((completedRequiredFields / requiredFields) * 100)
      : 100;

    const isReadyForSubmission = completedRequiredFields === requiredFields && fieldsWithErrors === 0;

    return {
      totalFields,
      requiredFields,
      completedFields,
      completedRequiredFields,
      fieldsWithErrors,
      fieldsWithNotes,
      completionPercentage,
      isReadyForSubmission,
      sectionsCount: sections.length,
    };
  }, [inspection.sections, formState.fields]);

  return (
    <div className={`inspection-form-summary bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('inspections.form.summary.title')}
        </h3>
      </div>

      {/* Inspection Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{t('inspections.form.summary.vehicle')}:</span>
            <span className="font-medium text-gray-900">
              {inspection.car?.name || t('inspections.form.summary.unknownVehicle')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{t('inspections.form.summary.customer')}:</span>
            <span className="font-medium text-gray-900">
              {inspection.customer?.name || t('inspections.form.summary.unknownCustomer')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{t('inspections.form.summary.inspectionNumber')}:</span>
            <span className="font-medium text-gray-900">
              {inspection.inspection_number || `#${inspection.id}`}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('inspections.form.summary.sections')}:</span>
            <span className="font-medium text-gray-900">
              {summary.sectionsCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('inspections.form.summary.totalFields')}:</span>
            <span className="font-medium text-gray-900">
              {summary.totalFields}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('inspections.form.summary.requiredFields')}:</span>
            <span className="font-medium text-gray-900">
              {summary.requiredFields}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">{t('inspections.form.summary.formProgress')}</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {summary.completionPercentage}%
            </div>
            <div className="text-sm text-gray-600">{t('inspections.form.summary.complete')}</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700 mb-1">
              {summary.completedRequiredFields}
            </div>
            <div className="text-sm text-green-600">{t('inspections.form.summary.requiredDone')}</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {summary.completedFields}
            </div>
            <div className="text-sm text-blue-600">{t('inspections.form.summary.totalDone')}</div>
          </div>

          {summary.fieldsWithErrors > 0 && (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700 mb-1">
                {summary.fieldsWithErrors}
              </div>
              <div className="text-sm text-red-600">{t('inspections.form.summary.errors')}</div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          summary.isReadyForSubmission 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          {summary.isReadyForSubmission ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">{t('inspections.form.summary.readyForSubmission')}</p>
                <p className="text-sm text-green-600">
                  {t('inspections.form.summary.allRequiredCompleted')}
                </p>
              </div>
            </>
          ) : (
            <>
              {summary.fieldsWithErrors > 0 ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className={`font-medium ${
                  summary.fieldsWithErrors > 0 ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {summary.fieldsWithErrors > 0 ? t('inspections.form.summary.needsAttention') : t('inspections.form.summary.inProgress')}
                </p>
                <p className={`text-sm ${
                  summary.fieldsWithErrors > 0 ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {summary.fieldsWithErrors > 0 
                    ? t('inspections.form.summary.fixErrors', { 
                        count: summary.fieldsWithErrors,
                        plural: summary.fieldsWithErrors > 1 ? 's' : ''
                      })
                    : t('inspections.form.summary.remainingRequired', { 
                        count: summary.requiredFields - summary.completedRequiredFields,
                        plural: (summary.requiredFields - summary.completedRequiredFields) > 1 ? 's' : ''
                      })
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectionFormSummary;
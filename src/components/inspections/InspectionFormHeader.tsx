import React from 'react';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { SaveStatusIndicator } from '../../components/common';
import type { Inspection } from '../../types/inspection';
import type { SubmissionStatus, ManualSaveStatus } from '../../types/form';
import { useTranslation } from '@/hooks/useTranslation';

interface InspectionFormHeaderProps {
  inspection: Inspection;
  saveStatus: ManualSaveStatus;
  submissionStatus: SubmissionStatus;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  forceArabic?: boolean;
}

const InspectionFormHeader: React.FC<InspectionFormHeaderProps> = ({
  inspection,
  saveStatus,
  submissionStatus,
  onBack,
  onSubmit,
  isSubmitting,
  forceArabic = false,
}) => {
  const { t } = useTranslation();
  const getSubmitButtonContent = () => {
    switch (submissionStatus.status) {
      case 'validating':
        return (
          <>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            <span className="hidden sm:inline">{forceArabic ? 'جار التحقق...' : 'Validating...'}</span>
            <span className="sm:hidden text-xs">{forceArabic ? 'تحقق' : 'Validating'}</span>
          </>
        );
      case 'submitting':
        return (
          <>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            <span className="hidden sm:inline">{forceArabic ? 'جار الإرسال...' : 'Submitting...'}</span>
            <span className="sm:hidden text-xs">{forceArabic ? 'إرسال' : 'Submitting'}</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{forceArabic ? 'تم الإرسال' : 'Submitted!'}</span>
            <span className="sm:hidden text-xs">{forceArabic ? 'تم' : 'Done!'}</span>
          </>
        );
      default:
        return (
          <>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{forceArabic ? 'إرسال الفحص' : t('inspections.actions.submitInspection')}</span>
            <span className="sm:hidden text-xs">{forceArabic ? 'إرسال' : t('inspections.actions.submit')}</span>
          </>
        );
    }
  };

  const isSubmitDisabled = 
    isSubmitting ||
    submissionStatus.status === 'validating' ||
    submissionStatus.status === 'submitting' ||
    submissionStatus.status === 'success';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Header row with back button and title */}
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline text-sm">{forceArabic ? 'رجوع' : t('inspections.actions.back')}</span>
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate leading-tight">
              {forceArabic ? 'إنشاء فحص يدوي' : t('inspections.actions.editInspection')}
            </h1>
            <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base truncate">
              {inspection.inspection_number || `Inspection #${inspection.id}`} - {inspection.car?.name}
            </p>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3">
          {!forceArabic && (
            <SaveStatusIndicator
              status={saveStatus}
              className="flex-shrink-0"
            />
          )}
          
          {inspection.actions.can_complete && (
            <button
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm sm:text-base min-h-[44px] sm:min-h-0"
            >
              {getSubmitButtonContent()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectionFormHeader;

import React, { useState, useCallback } from 'react';
import { useParams
  //, useNavigate
 } from 'react-router-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useGetInspectionQuery } from '../store/api/inspectionApi';
import { useTranslation } from '../hooks/useTranslation';
import { useInspectionForm } from '../hooks/useInspectionForm';
import { useInspectionNavigation } from '../hooks/useInspectionNavigation';
import { InspectionFieldsRenderer, InspectionCompletionModal, InspectionFormSummary, PhotoPreviewGrid, PhotoModal, InspectionFormHeader, ManualSaveButton } from '../components/inspections';
import { UnsavedChangesModal, FormErrorDisplay } from '../components/common';
import InspectionFormProgress from '../components/inspections/InspectionFormProgress';

const InspectionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  //const navigate = useNavigate();
  const { t } = useTranslation();

  // State management - using custom hooks
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // API queries and mutations
  const {
    data: inspection,
    isLoading,
    error,
    refetch,
  } = useGetInspectionQuery(Number(id), {
    skip: !id || isNaN(Number(id)),
  });



  // Custom hooks for form management
  const inspectionForm = useInspectionForm(inspection);

  const {
    formState,
    fieldNotes,
    fieldPhotos,
    hasUnsavedChanges,
    saveStatus,
    submissionStatus,
    formErrors,
    photoErrors,
    handleFieldChange,
    handleNotesChange,
    handlePhotosChange,
    handleFieldBlur,
    handleSubmit,
    handleCompletionSubmit,
    handleManualSave,
    isReadyForCompletion,
    clearReadyForCompletion,
    handlePhotoClick,
    handlePhotoDelete,
    allPhotosForPreview,
    showPhotoModal,
    selectedPhotoIndex,
    closePhotoModal,
  } = inspectionForm;

  // Show completion modal when form is ready for completion
  React.useEffect(() => {
    if (isReadyForCompletion && !showCompletionModal) {
      setShowCompletionModal(true);
      clearReadyForCompletion();
    }
  }, [isReadyForCompletion, showCompletionModal, clearReadyForCompletion]);

  // Enhanced form submission with manual save integration
  const handleFormSubmit = useCallback(async () => {
    // If there are unsaved changes, save them first
    if (hasUnsavedChanges) {
      try {
        await handleManualSave();
      } catch (error) {
        // If manual save fails, don't proceed with submission
        console.error('Failed to save changes before submission:', error);
        return;
      }
    }
    
    // Proceed with form submission
    await handleSubmit();
  }, [hasUnsavedChanges, handleManualSave, handleSubmit]);

  // Navigation management
  const navigation = useInspectionNavigation({
    hasUnsavedChanges,
    isSubmitting: submissionStatus.status === 'submitting' || submissionStatus.status === 'validating',
    onConfirmNavigation: () => {
      // Reset form state when confirming navigation
      setShowCompletionModal(false);
      setShowSummary(false);
    },
  });

  const {
    showUnsavedModal,
    handleNavigation,
    handleBack,
    handleModalConfirm,
    handleModalCancel,
  } = navigation;

  // Enhanced navigation with save and leave option
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);

  const handleSaveAndLeave = useCallback(async () => {
    if (!hasUnsavedChanges) {
      handleModalConfirm();
      return;
    }

    setIsSavingBeforeLeave(true);
    try {
      await handleManualSave();
      handleModalConfirm();
    } catch (error) {
      console.error('Failed to save before leaving:', error);
      // Still allow leaving even if save fails, but user was warned
      handleModalConfirm();
    } finally {
      setIsSavingBeforeLeave(false);
    }
  }, [hasUnsavedChanges, handleManualSave, handleModalConfirm]);

  // Validation check - early return for invalid ID
  if (!id || isNaN(Number(id))) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-800 font-medium">Invalid inspection ID</p>
          </div>
          <p className="text-red-600 text-sm mt-1">
            Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !inspection) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-800 font-medium">
              {error ? 'Failed to load inspection' : 'Inspection not found'}
            </p>
          </div>
          <p className="text-red-600 text-sm mt-1">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => handleNavigation('/inspections')}
              className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Back to Inspections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-full">

        {/* Header */}
        <InspectionFormHeader
          inspection={inspection}
          saveStatus={saveStatus}
          submissionStatus={submissionStatus}
          onBack={handleBack}
          onSubmit={handleFormSubmit}
          isSubmitting={submissionStatus.status === 'submitting' || submissionStatus.status === 'validating'}
        />

        {/* Form Validation Errors */}
        <FormErrorDisplay
          errors={formErrors}
          submissionStatus={submissionStatus}
          className="mb-4 sm:mb-6"
        />

        {/* Submission Status */}
        {submissionStatus.status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 font-medium text-sm sm:text-base">Inspection submitted successfully!</p>
            </div>
          </div>
        )}

        {/* Form Progress Overview */}
        <InspectionFormProgress
          sections={inspection.sections || []}
          formState={formState}
        />

        {/* Inspection Form Sections */}
        <div className="space-y-8 w-full max-w-full overflow-x-hidden">
          <InspectionFieldsRenderer
            sections={inspection.sections || []}
            formState={formState}
            fieldNotes={fieldNotes}
            fieldPhotos={fieldPhotos}
            photoErrors={photoErrors}
            inspectionId={inspection.id}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
            onNotesChange={handleNotesChange}
            onPhotosChange={handlePhotosChange}
            onPhotoClick={handlePhotoClick}
            onPhotoDelete={handlePhotoDelete}
            disabled={submissionStatus.status === 'submitting' || submissionStatus.status === 'validating'}
            showLabels={true}
            showHelp={true}
            showRequired={true}
            enablePhotoUpload={true}
          />

          {/* Photo Preview Section */}
          {allPhotosForPreview.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Uploaded Photos ({allPhotosForPreview.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Click to view • Delete unwanted photos
                </p>
              </div>

              <PhotoPreviewGrid
                photos={allPhotosForPreview}
                onPhotoClick={handlePhotoClick}
                onPhotoDelete={handlePhotoDelete}
                readOnly={false}
              />
            </div>
          )}

          {/* Summary Section - Show when form has significant progress */}
          {(formState.isDirty || Object.keys(formState.fields).length > 0) && (
            <div className="mt-6 sm:mt-8 w-full max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('inspections.form.summary.title')}</h2>
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto"
                >
                  {showSummary ? t('inspections.form.summary.hideSummary') : t('inspections.form.summary.showSummary')}
                </button>
              </div>

              {showSummary && (
                <InspectionFormSummary
                  inspection={inspection}
                  formState={formState}
                />
              )}
            </div>
          )}
        </div>

        {/* Completion Modal */}
        <InspectionCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            clearReadyForCompletion();
          }}
          onSubmit={handleCompletionSubmit}
          isSubmitting={submissionStatus.status === 'submitting'}
          inspectionNumber={inspection.inspection_number}
        />

        {/* Unsaved Changes Modal */}
        <UnsavedChangesModal
          isOpen={showUnsavedModal}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          onSaveAndLeave={handleSaveAndLeave}
          showSaveOption={hasUnsavedChanges}
          isSaving={isSavingBeforeLeave}
          message="You have unsaved changes that will be lost if you leave this page. You can save your changes before leaving or continue without saving."
        />

        {/* Photo Modal */}
        {showPhotoModal && allPhotosForPreview.length > 0 && (
          <PhotoModal
            photos={allPhotosForPreview}
            currentIndex={selectedPhotoIndex}
            isOpen={showPhotoModal}
            onClose={closePhotoModal}
            onDelete={handlePhotoDelete}
            readOnly={false}
          />
        )}

        {/* Manual Save Button */}
        <ManualSaveButton
          onSave={handleManualSave}
          saveStatus={saveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          disabled={submissionStatus.status === 'submitting' || submissionStatus.status === 'validating'}
        />
      </div>
    </div>
  );
};

export default InspectionFormPage;
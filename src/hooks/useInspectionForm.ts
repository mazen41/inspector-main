import { useState, useCallback, useMemo } from 'react';
import { useRemoveFieldPhotoMutation } from '../store/api/inspectionApi';
import { useInspectionFormState } from './useInspectionFormState';
import { useInspectionSubmission } from './useInspectionSubmission';
import { useInspectionManualSave } from './useInspectionManualSave';

import type {
  Inspection,
  InspectionPhoto,
  FieldValue,
} from '../types/inspection';
import type {
  InspectionFormHookReturn,
  ManualSaveUpdate,
} from '../types/form';

/**
 * Configuration options for the main inspection form hook
 */
export interface InspectionFormConfig {
  /** Form state configuration */
  formState?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
  };
  /** Submission configuration */
  submission?: {
    navigateOnSuccess?: boolean;
    successNavigationPath?: string;
  };
}

/**
 * Default configuration for the inspection form
 */
const defaultConfig: Required<InspectionFormConfig> = {
  formState: {
    validateOnChange: true,
    validateOnBlur: true,
  },
  submission: {
    navigateOnSuccess: true,
    successNavigationPath: '',
  },
};

/**
 * Main orchestrator hook for inspection form management
 * 
 * This hook combines all form-related functionality into a single interface:
 * - Form state management (useInspectionFormState)
 * - Form submission (useInspectionSubmission)
 * - Navigation management (useInspectionNavigation)
 * - Photo management
 * 
 * It provides a unified API for the InspectionFormPage component.
 */
export const useInspectionForm = (
  inspection: Inspection | undefined,
  config: Partial<InspectionFormConfig> = {}
): InspectionFormHookReturn => {
  const mergedConfig = {
    formState: { ...defaultConfig.formState, ...config.formState },
    submission: {
      ...defaultConfig.submission,
      ...config.submission,
      successNavigationPath: config.submission?.successNavigationPath ||
        (inspection ? `/inspections/${inspection.id}` : '/inspections'),
    },
  };

  // Photo modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // API mutations
  const [removeFieldPhoto] = useRemoveFieldPhotoMutation();

  // 1. Form State Management
  const formStateHook = useInspectionFormState(inspection, {
    validateOnChange: mergedConfig.formState.validateOnChange,
    validateOnBlur: mergedConfig.formState.validateOnBlur,
  });

  const {
    formState,
    fieldNotes,
    fieldPhotos,
    hasUnsavedChanges,
    handleFieldChange,
    handleNotesChange,
    handlePhotosChange,
    handleFieldBlur,
    formValidation,
    getAllFields,
    markFormAsClean,
  } = formStateHook;

  // 2. Form Submission Management
  const submissionHook = useInspectionSubmission(
    inspection,
    getAllFields(),
    formValidation,
    fieldNotes,
    fieldPhotos,
    markFormAsClean,
    {
      navigateOnSuccess: mergedConfig.submission.navigateOnSuccess,
      successNavigationPath: mergedConfig.submission.successNavigationPath,
    }
  );

  const {
    submissionStatus,
    formErrors,
    photoErrors,
    handleSubmit,
    handleCompletionSubmit,
    isReadyForCompletion,
    clearReadyForCompletion,
  } = submissionHook;

  // 3. Manual Save Management
  const manualSaveHook = useInspectionManualSave(inspection?.id, {
    onSaveSuccess: markFormAsClean,
  });

  const {
    saveStatus,
    handleManualSave: performManualSave,
    // clearSaveStatus,
    // isSaving,
  } = manualSaveHook;

  // 4. Navigation Management
  // Navigation is handled by the parent component using useInspectionNavigation directly
  // const navigationHook = useInspectionNavigation({
  //   hasUnsavedChanges,
  //   isSubmitting: submissionStatus.status === 'submitting' || 
  //                 submissionStatus.status === 'validating',
  // });

  // 5. Manual Save Handler - optimized to reduce expensive computations
  const handleManualSave = useCallback(async (): Promise<void> => {
    if (!inspection || !hasUnsavedChanges) {
      return;
    }

    // Use a more efficient approach - only process changed fields
    const updates: ManualSaveUpdate[] = [];
    const changedValues = formValidation.getChangedValues();
    
    // Process field value updates for changed fields only
    Object.entries(changedValues).forEach(([fieldIdStr, value]) => {
      const fieldId = parseInt(fieldIdStr);
      
      if (value !== undefined && value !== null && value !== '') {
        updates.push({
          field_id: fieldId,
          value: value as FieldValue,
          notes: fieldNotes[fieldId] || undefined,
          photos: fieldPhotos[fieldId] || undefined,
        });
      }
    });

    // Add notes-only updates for fields without value changes
    Object.entries(fieldNotes).forEach(([fieldIdStr, notes]) => {
      const fieldId = parseInt(fieldIdStr);
      if (notes && !changedValues[fieldId]) {
        updates.push({
          field_id: fieldId,
          value: formValidation.getFieldValue(fieldId),
          notes,
          photos: fieldPhotos[fieldId] || undefined,
        });
      }
    });

    // Add photo-only updates for fields without value or note changes
    Object.entries(fieldPhotos).forEach(([fieldIdStr, photos]) => {
      const fieldId = parseInt(fieldIdStr);
      if (photos.length > 0 && !changedValues[fieldId] && !fieldNotes[fieldId]) {
        updates.push({
          field_id: fieldId,
          value: formValidation.getFieldValue(fieldId),
          photos,
        });
      }
    });

    if (updates.length > 0) {
      await performManualSave(updates);
    }
  }, [inspection, hasUnsavedChanges, formValidation, fieldNotes, fieldPhotos, performManualSave]);

  // 6. Photo Management - optimized to avoid expensive getAllFields() calls
  // Create combined photos array for preview - memoized with better dependencies
  const allPhotosForPreview = useMemo(() => {
    const photosWithFieldNames: (InspectionPhoto & { fieldName?: string })[] = [];
    
    // Only process fields that actually have photos to reduce computation
    Object.entries(fieldPhotos).forEach(([fieldIdStr, photos]) => {
      if (photos && photos.length > 0) {
        const fieldId = parseInt(fieldIdStr);
        // Find field name from inspection sections instead of flattening all fields
        let fieldName = `Field ${fieldId}`;
        
        if (inspection?.sections) {
          for (const section of inspection.sections) {
            const field = section.fields.find(f => f.id === fieldId);
            if (field) {
              fieldName = field.display_name || field.name;
              break;
            }
          }
        }

        photos.forEach(photo => {
          photosWithFieldNames.push({
            ...photo,
            fieldName,
          });
        });
      }
    });

    return photosWithFieldNames;
  }, [fieldPhotos, inspection?.sections]);

  // Handle photo click to open modal
  const handlePhotoClick = useCallback((photo: InspectionPhoto) => {
    const photoIndex = allPhotosForPreview.findIndex(p => p.id === photo.id);
    if (photoIndex !== -1) {
      setSelectedPhotoIndex(photoIndex);
      setShowPhotoModal(true);
    }
  }, [allPhotosForPreview]);

  // Handle photo deletion
  const handlePhotoDelete = useCallback(async (photoId: number) => {
    if (!inspection) return;

    try {
      // Find which field this photo belongs to
      let targetFieldId: number | null = null;

      for (const [fieldIdStr, photos] of Object.entries(fieldPhotos)) {
        if (photos.some(p => p.id === photoId)) {
          targetFieldId = parseInt(fieldIdStr);
          break;
        }
      }

      if (targetFieldId === null) {
        console.error('Could not find field for photo ID:', photoId);
        return;
      }

      // Call the API to remove the photo
      await removeFieldPhoto({
        inspectionId: inspection.id,
        fieldId: targetFieldId,
        photoId: photoId,
      }).unwrap();

      // Update local state to remove the photo
      const updatedPhotos = fieldPhotos[targetFieldId]?.filter(p => p.id !== photoId) || [];
      handlePhotosChange(targetFieldId, updatedPhotos);

    } catch (error: any) {
      console.error('Failed to remove photo:', error);
      // You might want to show a toast notification here
      alert(error?.data?.message || 'Failed to remove photo. Please try again.');
    }
  }, [inspection, fieldPhotos, removeFieldPhoto, handlePhotosChange]);

  // Handle photo modal close
  const closePhotoModal = useCallback(() => {
    setShowPhotoModal(false);
  }, []);

  // Return the unified API
  return {
    // Form state
    formState,
    fieldNotes,
    fieldPhotos,
    hasUnsavedChanges,

    // Status states
    saveStatus,
    submissionStatus,
    formErrors,
    photoErrors,

    // Field handlers
    handleFieldChange,
    handleNotesChange,
    handlePhotosChange,
    handleFieldBlur,

    // Form submission
    handleSubmit,
    handleCompletionSubmit,
    isReadyForCompletion,
    clearReadyForCompletion,

    // Manual save
    handleManualSave,

    // Photo management
    handlePhotoClick,
    handlePhotoDelete,
    allPhotosForPreview,

    // Photo modal state
    showPhotoModal,
    selectedPhotoIndex,
    closePhotoModal,
  };
};

export default useInspectionForm;
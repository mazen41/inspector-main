import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUpdateFieldValuesMutation,
  useCompleteInspectionMutation,
} from '../store/api/inspectionApi';
import { getAllErrorMessages } from '../utils/validation';
import { validatePhotoCount } from '../utils/photoValidation';
import type {
  Inspection,
  InspectionField,
  FieldValue,
  InspectionPhoto,
  SubmissionStatus,
} from '../types';
import type { InspectionCompletionData } from '../types/form';
import type { FormValidationResult } from '../types/inspection';

/**
 * Configuration options for the submission hook
 */
export interface SubmissionConfig {
  /** Whether to navigate after successful completion */
  navigateOnSuccess?: boolean;
  /** Custom navigation path after success */
  successNavigationPath?: string;
  /** Delay before navigation in milliseconds */
  navigationDelay?: number;
}

/**
 * Data structure for field updates during submission
 */
export interface SubmissionFieldUpdate {
  field_id: number;
  value: FieldValue;
  notes: string;
  photos: InspectionPhoto[];
}

/**
 * Return type for the useInspectionSubmission hook
 */
export interface InspectionSubmissionReturn {
  /** Current submission status */
  submissionStatus: SubmissionStatus;
  /** Form validation errors */
  formErrors: string[];
  /** Photo validation errors by field ID */
  photoErrors: Record<number, string>;
  /** Handle form submission (opens completion modal) */
  handleSubmit: () => Promise<void>;
  /** Handle completion modal submission */
  handleCompletionSubmit: (data: InspectionCompletionData) => Promise<void>;
  /** Clear submission status and errors */
  clearSubmissionState: () => void;
  /** Check if currently submitting */
  isSubmitting: boolean;
  /** Flag indicating form is ready for completion modal */
  isReadyForCompletion: boolean;
  /** Clear the ready for completion flag */
  clearReadyForCompletion: () => void;
}

/**
 * Default configuration for submission
 */
const defaultConfig: Required<SubmissionConfig> = {
  navigateOnSuccess: true,
  successNavigationPath: '', // Will be set based on inspection ID
  navigationDelay: 1000, // 1 second
};

/**
 * Custom hook for managing inspection form submission
 * 
 * This hook handles:
 * - Form validation before submission
 * - Saving field values before opening completion modal
 * - Managing submission status and error states
 * - Integration with completion modal flow
 * - Navigation after successful completion
 */
export const useInspectionSubmission = (
  inspection: Inspection | undefined,
  allFields: InspectionField[],
  formValidation: {
    validateForm: () => Promise<boolean>;
    getChangedValues: () => Record<number, FieldValue>;
    getFieldValue: (fieldId: number) => FieldValue;
    setSubmitting: (submitting: boolean) => void;
    resetForm: (values: Record<number, FieldValue>) => void;
    validationResult: FormValidationResult;
  },
  fieldNotes: Record<number, string>,
  fieldPhotos: Record<number, InspectionPhoto[]>,
  markFormAsClean: () => void,
  config: Partial<SubmissionConfig> = {}
): InspectionSubmissionReturn => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    successNavigationPath: config.successNavigationPath || 
      (inspection ? `/inspections/${inspection.id}` : '/inspections'),
  };

  const navigate = useNavigate();

  // State management
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>({
    status: 'idle',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [photoErrors, setPhotoErrors] = useState<Record<number, string>>({});
  const [isReadyForCompletion, setIsReadyForCompletion] = useState(false);

  // Refs for managing submission state
  const isSubmittingRef = useRef(false);

  // RTK Query mutations
  const [updateFieldValues] = useUpdateFieldValuesMutation();
  const [completeInspection] = useCompleteInspectionMutation();

  /**
   * Validate photos for all fields
   */
  const validatePhotos = useCallback((): boolean => {
    const errors: Record<number, string> = {};
    let hasErrors = false;

    Object.entries(fieldPhotos).forEach(([fieldIdStr, photos]) => {
      const fieldId = parseInt(fieldIdStr);
      const field = allFields.find(f => f.id === fieldId);
      
      if (field && photos.length > 0) {
        const photoCountValidation = validatePhotoCount(photos.length, 0);
        if (!photoCountValidation.isValid) {
          errors[fieldId] = `${field.display_name || field.name}: ${photoCountValidation.error}`;
          hasErrors = true;
        }
      }
    });

    setPhotoErrors(errors);
    return !hasErrors;
  }, [fieldPhotos, allFields]);

  /**
   * Save field values before submission
   */
  const saveFieldValues = useCallback(async (): Promise<void> => {
    if (!inspection) {
      throw new Error('No inspection available for saving');
    }

    const changedValues = formValidation.getChangedValues();
    const allFieldIds = new Set([
      ...Object.keys(changedValues).map(Number),
      ...Object.keys(fieldNotes).map(Number),
      ...Object.keys(fieldPhotos).map(Number),
    ]);

    if (allFieldIds.size === 0) {
      return; // No changes to save
    }

    const fieldValuesToSave: SubmissionFieldUpdate[] = Array.from(allFieldIds).map(fieldId => ({
      field_id: fieldId,
      value: changedValues[fieldId] !== undefined 
        ? changedValues[fieldId] 
        : formValidation.getFieldValue(fieldId),
      notes: fieldNotes[fieldId] || '',
      photos: fieldPhotos[fieldId] || [],
    }));

    await updateFieldValues({
      id: inspection.id,
      fieldValues: fieldValuesToSave,
    }).unwrap();
  }, [
    inspection,
    formValidation,
    fieldNotes,
    fieldPhotos,
    updateFieldValues,
  ]);

  /**
   * Handle form submission - validates and opens completion modal
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!inspection || isSubmittingRef.current) {
      return;
    }

    try {
      // Step 1: Set validation status
      setSubmissionStatus({ status: 'validating' });
      setFormErrors([]);
      setPhotoErrors({});

      // Step 2: Validate the form
      const isFormValid = await formValidation.validateForm();

      if (!isFormValid) {
        const errorMessages = getAllErrorMessages(formValidation.validationResult);
        setFormErrors(errorMessages);
        setSubmissionStatus({
          status: 'error',
          error: 'Please fix the validation errors before submitting.',
        });
        return;
      }

      // Step 3: Validate photos
      const arePhotosValid = validatePhotos();

      if (!arePhotosValid) {
        const photoErrorMessages = Object.values(photoErrors);
        setFormErrors(photoErrorMessages);
        setSubmissionStatus({
          status: 'error',
          error: 'Please fix the photo validation errors before submitting.',
        });
        return;
      }

      // Step 4: Save field values
      setSubmissionStatus({ status: 'submitting' });
      formValidation.setSubmitting(true);
      isSubmittingRef.current = true;

      await saveFieldValues();

      // Step 5: Reset submission status and signal ready for completion
      setSubmissionStatus({ status: 'idle' });
      formValidation.setSubmitting(false);
      isSubmittingRef.current = false;
      setIsReadyForCompletion(true);

    } catch (error: any) {
      console.error('Failed to save inspection data:', error);

      let errorMessage = 'Failed to save inspection data. Please try again.';

      // Handle specific API errors
      if (error?.data?.error?.message) {
        errorMessage = error.data.error.message;
      } else if (error?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = Object.values(error.data.errors).flat() as string[];
        setFormErrors(serverErrors);
        errorMessage = 'Please fix the errors and try again.';
      }

      setSubmissionStatus({
        status: 'error',
        error: errorMessage,
      });
      formValidation.setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    inspection,
    formValidation,
    validatePhotos,
    photoErrors,
    saveFieldValues,
  ]);

  /**
   * Handle completion modal submission
   */
  const handleCompletionSubmit = useCallback(async (
    completionData: InspectionCompletionData
  ): Promise<void> => {
    if (!inspection) {
      throw new Error('No inspection available for completion');
    }

    try {
      // Complete the inspection with the completion data
      await completeInspection({
        id: inspection.id,
        completion_data: completionData,
      }).unwrap();

      // Success - update status and reset form
      setSubmissionStatus({ status: 'success' });
      
      // Mark form as clean (no unsaved changes)
      markFormAsClean();

      // Navigate after delay if configured
      if (mergedConfig.navigateOnSuccess) {
        setTimeout(() => {
          navigate(mergedConfig.successNavigationPath);
        }, mergedConfig.navigationDelay);
      }

    } catch (error: any) {
      console.error('Failed to complete inspection:', error);
      
      // Re-throw error to let the completion modal handle it
      throw error;
    }
  }, [
    inspection,
    completeInspection,
    formValidation,
    navigate,
    mergedConfig.navigateOnSuccess,
    mergedConfig.successNavigationPath,
    mergedConfig.navigationDelay,
  ]);

  /**
   * Clear submission status and errors
   */
  const clearSubmissionState = useCallback(() => {
    setSubmissionStatus({ status: 'idle' });
    setFormErrors([]);
    setPhotoErrors({});
    setIsReadyForCompletion(false);
  }, []);

  /**
   * Clear the ready for completion flag
   */
  const clearReadyForCompletion = useCallback(() => {
    setIsReadyForCompletion(false);
  }, []);

  /**
   * Check if currently submitting
   */
  const isSubmitting = submissionStatus.status === 'validating' ||
    submissionStatus.status === 'submitting' ||
    isSubmittingRef.current;

  return {
    submissionStatus,
    formErrors,
    photoErrors,
    handleSubmit,
    handleCompletionSubmit,
    clearSubmissionState,
    isSubmitting,
    isReadyForCompletion,
    clearReadyForCompletion,
  };
};
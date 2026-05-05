import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  Inspection,
  InspectionField,
  InspectionFormState,
  FieldValue,
  InspectionPhoto,
} from '../types/inspection';
import { useFormValidation } from './useFormValidation';

/**
 * Configuration options for the inspection form state hook
 */
export interface InspectionFormStateConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  sanitizeValues?: boolean;
}

/**
 * Return type for the useInspectionFormState hook
 */
export interface InspectionFormStateReturn {
  // Form state
  formState: InspectionFormState;
  fieldNotes: Record<number, string>;
  fieldPhotos: Record<number, InspectionPhoto[]>;
  hasUnsavedChanges: boolean;
  isFormInitialized: boolean;

  // Field management
  handleFieldChange: (fieldId: number, value: FieldValue) => void;
  handleNotesChange: (fieldId: number, notes: string) => void;
  handlePhotosChange: (fieldId: number, photos: InspectionPhoto[]) => void;
  handleFieldBlur: (fieldId: number) => void;

  // Form validation integration
  formValidation: ReturnType<typeof useFormValidation>;

  // Utility functions
  getAllFields: () => InspectionField[];
  getInitialFormValues: () => Record<number, FieldValue>;
  resetFormState: () => void;
  markFormAsClean: () => void;
}

/**
 * Default configuration for the form state hook
 */
const defaultConfig: InspectionFormStateConfig = {
  validateOnChange: true,
  validateOnBlur: true,
  debounceMs: 300,
  sanitizeValues: true,
};

/**
 * Custom hook for managing inspection form state
 * 
 * This hook handles:
 * - Form initialization from inspection data
 * - Field values, notes, and photos state management
 * - Dirty state tracking
 * - Integration with form validation
 */
export const useInspectionFormState = (
  inspection: Inspection | undefined,
  config: Partial<InspectionFormStateConfig> = {}
): InspectionFormStateReturn => {
  const mergedConfig = { ...defaultConfig, ...config };

  // State management
  const [fieldNotes, setFieldNotes] = useState<Record<number, string>>({});
  const [fieldPhotos, setFieldPhotos] = useState<Record<number, InspectionPhoto[]>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<Record<number, FieldValue>>({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Refs for managing state updates
  const fieldNotesRef = useRef<Record<number, string>>({});
  const fieldPhotosRef = useRef<Record<number, InspectionPhoto[]>>({});

  // Get all fields from inspection - memoized to prevent infinite loops
  const allFields = useMemo(() => {
    return inspection?.sections?.flatMap(section => section.fields) || [];
  }, [inspection?.sections]);

  // Initialize form values from inspection data - only once when inspection first loads
  useEffect(() => {
    if (!inspection || !inspection.sections || isFormInitialized) return;

    const values: Record<number, FieldValue> = {};
    const notes: Record<number, string> = {};
    const photos: Record<number, InspectionPhoto[]> = {};

    inspection.sections.forEach(section => {
      section.fields.forEach(field => {
        const fieldValue = field?.value ?? null;
        values[field.id] = fieldValue;

        if (field.notes) {
          notes[field.id] = field.notes;
        }

        if (field.photos && field.photos.length > 0) {
          photos[field.id] = field.photos;
        }
      });
    });

    setInitialFormValues(values);
    setFieldNotes(notes);
    fieldNotesRef.current = notes;
    setFieldPhotos(photos);
    fieldPhotosRef.current = photos;
    setIsFormInitialized(true);
  }, [inspection, isFormInitialized]);

  // Initialize form validation with the extracted fields and initial values
  const formValidation = useFormValidation(allFields, initialFormValues, {
    validateOnChange: mergedConfig.validateOnChange,
    validateOnBlur: mergedConfig.validateOnBlur,
    debounceMs: mergedConfig.debounceMs,
    sanitizeValues: mergedConfig.sanitizeValues,
  });

  // Create form state based on validation hook
  const formState: InspectionFormState = useMemo(() => ({
    fields: formValidation.fieldStates,
    isSubmitting: formValidation.isSubmitting,
    isDirty: formValidation.isDirty,
    isValid: formValidation.isValid,
  }), [
    formValidation.fieldStates,
    formValidation.isSubmitting,
    formValidation.isDirty,
    formValidation.isValid,
  ]);

  // Update unsaved changes state based on form validation
  useEffect(() => {
    setHasUnsavedChanges(formValidation.isDirty);
  }, [formValidation.isDirty]);

  // Handle field value changes
  const handleFieldChange = useCallback((fieldId: number, value: FieldValue) => {
    formValidation.setFieldValue(fieldId, value);
  }, [formValidation]);

  // Handle field notes changes
  const handleNotesChange = useCallback((fieldId: number, notes: string) => {
    setFieldNotes(prev => {
      const newNotes = {
        ...prev,
        [fieldId]: notes
      };
      fieldNotesRef.current = newNotes;
      return newNotes;
    });

    // Mark form as dirty when notes change
    setHasUnsavedChanges(true);
  }, []);

  // Handle field photos changes
  const handlePhotosChange = useCallback((fieldId: number, photos: InspectionPhoto[]) => {
    setFieldPhotos(prev => {
      const newPhotos = {
        ...prev,
        [fieldId]: [...photos] // Ensure new array reference
      };
      fieldPhotosRef.current = newPhotos;
      return newPhotos;
    });

    // Mark form as dirty when photos change
    setHasUnsavedChanges(true);
  }, []);

  // Handle field blur for validation
  const handleFieldBlur = useCallback((fieldId: number) => {
    formValidation.setFieldTouched(fieldId, true);
  }, [formValidation]);

  // Utility function to get all fields
  const getAllFields = useCallback(() => {
    return allFields;
  }, [allFields]);

  // Utility function to get initial form values
  const getInitialFormValues = useCallback(() => {
    return initialFormValues;
  }, [initialFormValues]);

  // Reset form state to initial values
  const resetFormState = useCallback(() => {
    if (!inspection || !inspection.sections) return;

    const values: Record<number, FieldValue> = {};
    const notes: Record<number, string> = {};
    const photos: Record<number, InspectionPhoto[]> = {};

    inspection.sections.forEach(section => {
      section.fields.forEach(field => {
        const fieldValue = field?.value ?? null;
        values[field.id] = fieldValue;

        if (field.notes) {
          notes[field.id] = field.notes;
        }

        if (field.photos && field.photos.length > 0) {
          photos[field.id] = field.photos;
        }
      });
    });

    // Reset all state
    setInitialFormValues(values);
    setFieldNotes(notes);
    fieldNotesRef.current = notes;
    setFieldPhotos(photos);
    fieldPhotosRef.current = photos;
    setHasUnsavedChanges(false);

    // Reset form validation
    formValidation.resetForm(values);
  }, [inspection, formValidation]);

  // Mark form as clean (no unsaved changes) without resetting values
  const markFormAsClean = useCallback(() => {
    setHasUnsavedChanges(false);
    
    // Reset form validation to current values to mark as clean
    const currentValues: Record<number, FieldValue> = {};
    allFields.forEach(field => {
      currentValues[field.id] = formValidation.getFieldValue(field.id);
    });
    formValidation.resetForm(currentValues);
  }, [allFields, formValidation]);

  return {
    // Form state
    formState,
    fieldNotes,
    fieldPhotos,
    hasUnsavedChanges,
    isFormInitialized,

    // Field management
    handleFieldChange,
    handleNotesChange,
    handlePhotosChange,
    handleFieldBlur,

    // Form validation integration
    formValidation,

    // Utility functions
    getAllFields,
    getInitialFormValues,
    resetFormState,
    markFormAsClean,
  };
};
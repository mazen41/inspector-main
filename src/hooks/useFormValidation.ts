import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  InspectionField,
  FieldValue,
  FormValidationResult,
  FormFieldState,
} from '../types/inspection';
import {
  validateFields,
  validateField,
  getFieldErrorMessage,
  hasFieldError,
  sanitizeFieldValue,
} from '../utils/validation';
import { FORM_SETTINGS } from '../utils/constants';

/**
 * Configuration options for form validation
 */
export interface FormValidationConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  sanitizeValues?: boolean;
  showWarnings?: boolean;
}

/**
 * Form validation hook state
 */
export interface FormValidationState {
  // Field states
  fieldStates: Record<number, FormFieldState>;

  // Form-level state
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  // Validation results
  validationResult: FormValidationResult;

  // Touched fields tracking
  touchedFields: Set<number>;

  // Configuration
  config: FormValidationConfig;
}

/**
 * Form validation hook actions
 */
export interface FormValidationActions {
  // Field value management
  setFieldValue: (fieldId: number, value: FieldValue) => void;
  setFieldValues: (values: Record<number, FieldValue>) => void;
  getFieldValue: (fieldId: number) => FieldValue;
  getFieldState: (fieldId: number) => FormFieldState;

  // Field interaction tracking
  setFieldTouched: (fieldId: number, touched?: boolean) => void;
  setFieldError: (fieldId: number, error?: string) => void;

  // Validation actions
  validateField: (fieldId: number) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  clearValidation: () => void;
  clearFieldValidation: (fieldId: number) => void;

  // Form state management
  resetForm: (initialValues?: Record<number, FieldValue>) => void;
  setSubmitting: (submitting: boolean) => void;

  // Utility functions
  getFieldError: (fieldId: number) => string | undefined;
  hasFieldError: (fieldId: number) => boolean;
  getFormValues: () => Record<number, FieldValue>;
  getChangedValues: () => Record<number, FieldValue>;
  isFieldDirty: (fieldId: number) => boolean;
  isFieldTouched: (fieldId: number) => boolean;
}

/**
 * Default form validation configuration
 */
const defaultConfig: FormValidationConfig = {
  validateOnChange: true,
  validateOnBlur: true,
  debounceMs: FORM_SETTINGS.VALIDATION_DEBOUNCE_MS,
  sanitizeValues: true,
  showWarnings: false,
};

/**
 * Create initial field state
 */
const createInitialFieldState = (value: FieldValue): FormFieldState => ({
  value,
  touched: false,
  dirty: false,
});

/**
 * Form validation hook for managing form state and validation
 */
export const useFormValidation = (
  fields: InspectionField[],
  initialValues: Record<number, FieldValue> = {},
  config: Partial<FormValidationConfig> = {}
): FormValidationState & FormValidationActions => {
  const mergedConfig = { ...defaultConfig, ...config };

  // Initialize field states
  const initializeFieldStates = useCallback(() => {
    const states: Record<number, FormFieldState> = {};
    fields.forEach(field => {
      const initialValue = initialValues[field.id] ?? null;
      // Sanitize initial values if sanitization is enabled
      const sanitizedValue = mergedConfig.sanitizeValues
        ? sanitizeFieldValue(field, initialValue)
        : initialValue;
      

      
      states[field.id] = createInitialFieldState(sanitizedValue);
    });
    return states;
  }, [fields, initialValues, mergedConfig.sanitizeValues]);

  // State management
  const [fieldStates, setFieldStates] = useState<Record<number, FormFieldState>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationResult, setValidationResult] = useState<FormValidationResult>({
    isValid: true,
    errors: [],
  });
  const [touchedFields, setTouchedFields] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for debouncing
  const validationTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const initialValuesRef = useRef(initialValues);

  // Initialize field states only once when we have fields and initial values
  useEffect(() => {
    if (fields.length > 0 && Object.keys(initialValues).length > 0 && !isInitialized) {
      setFieldStates(initializeFieldStates());
      setIsInitialized(true);
    }
  }, [fields, initialValues, isInitialized, initializeFieldStates]);

  // Update initial values ref when it changes
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Computed state
  const isDirty = Object.values(fieldStates).some(state => state.dirty);
  const isValid = validationResult.isValid;

  /**
   * Get current field value
   */
  const getFieldValue = useCallback((fieldId: number): FieldValue => {
    return fieldStates[fieldId]?.value ?? null;
  }, [fieldStates]);

  /**
   * Get current field state
   */
  const getFieldState = useCallback((fieldId: number): FormFieldState => {
    return fieldStates[fieldId] || createInitialFieldState(null);
  }, [fieldStates]);

  /**
   * Get all form values
   */
  const getFormValues = useCallback((): Record<number, FieldValue> => {
    const values: Record<number, FieldValue> = {};
    Object.entries(fieldStates).forEach(([fieldId, state]) => {
      values[parseInt(fieldId)] = state.value;
    });
    return values;
  }, [fieldStates]);

  /**
   * Get only changed values (different from initial)
   */
  const getChangedValues = useCallback((): Record<number, FieldValue> => {
    const changed: Record<number, FieldValue> = {};
    Object.entries(fieldStates).forEach(([fieldId, state]) => {
      const id = parseInt(fieldId);
      const initialValue = initialValuesRef.current[id] ?? null;
      if (state.value !== initialValue) {
        changed[id] = state.value;
      }
    });
    return changed;
  }, [fieldStates]);

  /**
   * Check if field is dirty
   */
  const isFieldDirty = useCallback((fieldId: number): boolean => {
    return fieldStates[fieldId]?.dirty ?? false;
  }, [fieldStates]);

  /**
   * Check if field is touched
   */
  const isFieldTouched = useCallback((fieldId: number): boolean => {
    return touchedFields.has(fieldId);
  }, [touchedFields]);

  /**
   * Set field value with optional validation - optimized to reduce re-renders
   */
  const setFieldValue = useCallback((fieldId: number, value: FieldValue) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    // Sanitize value if enabled
    const sanitizedValue = mergedConfig.sanitizeValues
      ? sanitizeFieldValue(field, value)
      : value;

    // Update only the specific field state to avoid full re-render
    setFieldStates(prev => {
      const currentState = prev[fieldId] || createInitialFieldState(null);
      const initialValue = initialValuesRef.current[fieldId] ?? null;
      
      // Only update if value actually changed
      if (currentState.value === sanitizedValue) {
        return prev;
      }

      return {
        ...prev,
        [fieldId]: {
          ...currentState,
          value: sanitizedValue,
          dirty: sanitizedValue !== initialValue,
        },
      };
    });

    // Validate on change if enabled - use immediate validation for better UX
    if (mergedConfig.validateOnChange) {
      // Clear existing timeout
      if (validationTimeouts.current[fieldId]) {
        clearTimeout(validationTimeouts.current[fieldId]);
      }

      // Use shorter debounce for better responsiveness
      const debounceTime = Math.min(mergedConfig.debounceMs || 300, 150);
      validationTimeouts.current[fieldId] = setTimeout(() => {
        // Inline validation to avoid dependency issues
        const fieldToValidate = fields.find(f => f.id === fieldId);
        if (fieldToValidate) {
          const fieldValue = sanitizedValue;
          const allValues = getFormValues();
          const result = validateField(fieldToValidate, fieldValue, allValues);

          // Update field state with validation result
          setFieldStates(prevStates => ({
            ...prevStates,
            [fieldId]: {
              ...prevStates[fieldId],
              error: result.errors[0],
            },
          }));
        }
      }, debounceTime);
    }
  }, [fields, mergedConfig, getFormValues]);

  /**
   * Set multiple field values at once
   */
  const setFieldValues = useCallback((values: Record<number, FieldValue>) => {
    setFieldStates(prev => {
      const newStates = { ...prev };

      Object.entries(values).forEach(([fieldId, value]) => {
        const id = parseInt(fieldId);
        const field = fields.find(f => f.id === id);
        if (!field) return;

        const sanitizedValue = mergedConfig.sanitizeValues
          ? sanitizeFieldValue(field, value)
          : value;

        const currentState = prev[id] || createInitialFieldState(null);
        const initialValue = initialValuesRef.current[id] ?? null;

        newStates[id] = {
          ...currentState,
          value: sanitizedValue,
          dirty: sanitizedValue !== initialValue,
        };
      });

      return newStates;
    });

    // Validate all changed fields if enabled
    if (mergedConfig.validateOnChange) {
      setTimeout(() => {
        validateFormInternal();
      }, mergedConfig.debounceMs);
    }
  }, [fields, mergedConfig]);

  /**
   * Set field as touched
   */
  const setFieldTouched = useCallback((fieldId: number, touched = true) => {
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      if (touched) {
        newSet.add(fieldId);
      } else {
        newSet.delete(fieldId);
      }
      return newSet;
    });

    // Validate on blur if enabled and field is being touched
    if (touched && mergedConfig.validateOnBlur) {
      validateFieldInternal(fieldId);
    }
  }, [mergedConfig]);

  /**
   * Set field error manually
   */
  const setFieldError = useCallback((fieldId: number, error?: string) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        error,
      },
    }));

    // Update validation result
    setValidationResult(prev => {
      const errors = prev.errors.filter(e => e.field_id !== fieldId);
      if (error) {
        const field = fields.find(f => f.id === fieldId);
        errors.push({
          field_id: fieldId,
          field_name: field?.name || `Field ${fieldId}`,
          errors: [error],
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    });
  }, [fields]);

  /**
   * Internal field validation
   */
  const validateFieldInternal = useCallback(async (fieldId: number): Promise<boolean> => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return true;

    const fieldValue = getFieldValue(fieldId);
    const allValues = getFormValues();

    const result = validateField(field, fieldValue, allValues);

    // Update field state with validation result
    setFieldStates(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        error: result.errors[0],
      },
    }));

    // Update form validation result
    setValidationResult(prev => {
      const errors = prev.errors.filter(e => e.field_id !== fieldId);
      if (!result.isValid) {
        errors.push({
          field_id: fieldId,
          field_name: field.name,
          errors: result.errors,
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    });

    return result.isValid;
  }, [fields, getFieldValue, getFormValues]);

  /**
   * Internal form validation
   */
  const validateFormInternal = useCallback(async (): Promise<boolean> => {
    const values = getFormValues();
    const result = validateFields(fields, values);

    // Update field states with validation results
    setFieldStates(prev => {
      const newStates = { ...prev };

      // Clear all field errors first
      Object.keys(newStates).forEach(fieldId => {
        newStates[parseInt(fieldId)] = {
          ...newStates[parseInt(fieldId)],
          error: undefined,
        };
      });

      // Set new errors
      result.errors.forEach(error => {
        if (newStates[error.field_id]) {
          newStates[error.field_id] = {
            ...newStates[error.field_id],
            error: error.errors[0],
          };
        }
      });

      return newStates;
    });

    setValidationResult(result);
    return result.isValid;
  }, [fields, getFormValues]);

  /**
   * Validate single field (public API)
   */
  const validateFieldPublic = useCallback(async (fieldId: number): Promise<boolean> => {
    return validateFieldInternal(fieldId);
  }, [validateFieldInternal]);

  /**
   * Validate entire form (public API)
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    return validateFormInternal();
  }, [validateFormInternal]);

  /**
   * Clear all validation errors
   */
  const clearValidation = useCallback(() => {
    setValidationResult({ isValid: true, errors: [] });
    setFieldStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(fieldId => {
        newStates[parseInt(fieldId)] = {
          ...newStates[parseInt(fieldId)],
          error: undefined,
        };
      });
      return newStates;
    });
  }, []);

  /**
   * Clear validation for specific field
   */
  const clearFieldValidation = useCallback((fieldId: number) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        error: undefined,
      },
    }));

    setValidationResult(prev => ({
      isValid: prev.errors.filter(e => e.field_id !== fieldId).length === 0,
      errors: prev.errors.filter(e => e.field_id !== fieldId),
    }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback((newInitialValues?: Record<number, FieldValue>) => {
    const valuesToUse = newInitialValues || initialValues;
    initialValuesRef.current = valuesToUse;

    // Reinitialize field states with new values
    const states: Record<number, FormFieldState> = {};
    fields.forEach(field => {
      const initialValue = valuesToUse[field.id] ?? null;
      // Sanitize initial values if sanitization is enabled
      const sanitizedValue = mergedConfig.sanitizeValues
        ? sanitizeFieldValue(field, initialValue)
        : initialValue;
      states[field.id] = createInitialFieldState(sanitizedValue);
    });

    setFieldStates(states);
    setValidationResult({ isValid: true, errors: [] });
    setTouchedFields(new Set());
    setIsSubmitting(false);
    setIsInitialized(true);

    // Clear all validation timeouts
    Object.values(validationTimeouts.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    validationTimeouts.current = {};
  }, [initialValues, fields]);

  /**
   * Get field error message
   */
  const getFieldError = useCallback((fieldId: number): string | undefined => {
    return getFieldErrorMessage(fieldId, validationResult);
  }, [validationResult]);

  /**
   * Check if field has error
   */
  const hasFieldErrorPublic = useCallback((fieldId: number): boolean => {
    return hasFieldError(fieldId, validationResult);
  }, [validationResult]);

  /**
   * Set form submitting state
   */
  const setSubmittingPublic = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    // State
    fieldStates,
    isValid,
    isDirty,
    isSubmitting,
    validationResult,
    touchedFields,
    config: mergedConfig,

    // Actions
    setFieldValue,
    setFieldValues,
    getFieldValue,
    getFieldState,
    setFieldTouched,
    setFieldError,
    validateField: validateFieldPublic,
    validateForm,
    clearValidation,
    clearFieldValidation,
    resetForm,
    setSubmitting: setSubmittingPublic,
    getFieldError,
    hasFieldError: hasFieldErrorPublic,
    getFormValues,
    getChangedValues,
    isFieldDirty,
    isFieldTouched,
  };
};
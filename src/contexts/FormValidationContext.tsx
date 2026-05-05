import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type {
  InspectionField,
  FieldValue,
  FormValidationResult,
  FormFieldState,
} from '../types/inspection';
import { useFormValidation } from '../hooks/useFormValidation';
import type { FormValidationConfig } from '../hooks/useFormValidation';

/**
 * Form validation context type
 */
export interface FormValidationContextType {
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
 * Form validation context
 */
const FormValidationContext = createContext<FormValidationContextType | null>(null);

/**
 * Props for FormValidationProvider
 */
export interface FormValidationProviderProps {
  children: ReactNode;
  fields: InspectionField[];
  initialValues?: Record<number, FieldValue>;
  config?: Partial<FormValidationConfig>;
}

/**
 * Form validation provider component
 */
export const FormValidationProvider: React.FC<FormValidationProviderProps> = ({
  children,
  fields,
  initialValues = {},
  config = {},
}) => {
  const validationState = useFormValidation(fields, initialValues, config);
  
  return (
    <FormValidationContext.Provider value={validationState}>
      {children}
    </FormValidationContext.Provider>
  );
};

/**
 * Hook to use form validation context
 */
export const useFormValidationContext = (): FormValidationContextType => {
  const context = useContext(FormValidationContext);
  
  if (!context) {
    throw new Error('useFormValidationContext must be used within a FormValidationProvider');
  }
  
  return context;
};

/**
 * Hook to get field-specific validation state and actions
 */
export const useFieldValidation = (fieldId: number) => {
  const context = useFormValidationContext();
  
  const fieldState = context.getFieldState(fieldId);
  const value = context.getFieldValue(fieldId);
  const error = context.getFieldError(fieldId);
  const hasError = context.hasFieldError(fieldId);
  const isDirty = context.isFieldDirty(fieldId);
  const isTouched = context.isFieldTouched(fieldId);
  
  const setValue = (newValue: FieldValue) => {
    context.setFieldValue(fieldId, newValue);
  };
  
  const setTouched = (touched = true) => {
    context.setFieldTouched(fieldId, touched);
  };
  
  const setError = (errorMessage?: string) => {
    context.setFieldError(fieldId, errorMessage);
  };
  
  const validate = () => {
    return context.validateField(fieldId);
  };
  
  const clearError = () => {
    context.clearFieldValidation(fieldId);
  };
  
  return {
    // Field state
    fieldState,
    value,
    error,
    hasError,
    isDirty,
    isTouched,
    
    // Field actions
    setValue,
    setTouched,
    setError,
    validate,
    clearError,
  };
};

/**
 * Hook for form-level validation operations
 */
export const useFormValidationActions = () => {
  const context = useFormValidationContext();
  
  return {
    // Form state
    isValid: context.isValid,
    isDirty: context.isDirty,
    isSubmitting: context.isSubmitting,
    validationResult: context.validationResult,
    
    // Form actions
    validateForm: context.validateForm,
    clearValidation: context.clearValidation,
    resetForm: context.resetForm,
    setSubmitting: context.setSubmitting,
    getFormValues: context.getFormValues,
    getChangedValues: context.getChangedValues,
    setFieldValues: context.setFieldValues,
  };
};

/**
 * Higher-order component to provide form validation context
 */
export const withFormValidation = <P extends object>(
  Component: React.ComponentType<P>,
  fields: InspectionField[],
  initialValues?: Record<number, FieldValue>,
  config?: Partial<FormValidationConfig>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <FormValidationProvider
      fields={fields}
      initialValues={initialValues}
      config={config}
    >
      <Component {...props} />
    </FormValidationProvider>
  );
  
  WrappedComponent.displayName = `withFormValidation(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
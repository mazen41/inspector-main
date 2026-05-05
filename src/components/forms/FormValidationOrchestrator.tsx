import React, { useEffect, useCallback, useRef } from 'react';
import type {
  FieldValue,
  FormValidationResult,
} from '../../types/inspection';
import { useFormValidationContext } from '../../contexts/FormValidationContext';
import { ValidationSummary, ValidationStatus } from '../common/ValidationError';
import { getAllErrorMessages } from '../../utils/validation';

/**
 * Props for FormValidationOrchestrator
 */
export interface FormValidationOrchestratorProps {
  children: React.ReactNode;
  onValidationChange?: (result: FormValidationResult) => void;
  onFormStateChange?: (state: {
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
    values: Record<number, FieldValue>;
  }) => void;
  showValidationSummary?: boolean;
  showValidationStatus?: boolean;
  validateOnMount?: boolean;
  autoFocusFirstError?: boolean;
  className?: string;
}

/**
 * Form validation orchestrator component that manages form-wide validation behavior
 */
export const FormValidationOrchestrator: React.FC<FormValidationOrchestratorProps> = ({
  children,
  onValidationChange,
  onFormStateChange,
  showValidationSummary = false,
  showValidationStatus = false,
  validateOnMount = false,
  autoFocusFirstError = true,
  className = '',
}) => {
  const {
    isValid,
    isDirty,
    isSubmitting,
    validationResult,
    validateForm,
    getFormValues,
  } = useFormValidationContext();
  
  const previousValidationResult = useRef<FormValidationResult | null>(null);
  const previousFormState = useRef<any>(null);
  
  /**
   * Handle validation result changes
   */
  useEffect(() => {
    if (
      onValidationChange &&
      JSON.stringify(validationResult) !== JSON.stringify(previousValidationResult.current)
    ) {
      onValidationChange(validationResult);
      previousValidationResult.current = validationResult;
    }
  }, [validationResult, onValidationChange]);
  
  /**
   * Handle form state changes
   */
  useEffect(() => {
    const currentState = {
      isValid,
      isDirty,
      isSubmitting,
      values: getFormValues(),
    };
    
    if (
      onFormStateChange &&
      JSON.stringify(currentState) !== JSON.stringify(previousFormState.current)
    ) {
      onFormStateChange(currentState);
      previousFormState.current = currentState;
    }
  }, [isValid, isDirty, isSubmitting, getFormValues, onFormStateChange]);
  
  /**
   * Auto-focus first error field
   */
  useEffect(() => {
    if (autoFocusFirstError && !isValid && validationResult.errors.length > 0) {
      const firstErrorFieldId = validationResult.errors[0].field_id;
      const errorElement = document.querySelector(`[data-field-id="${firstErrorFieldId}"]`);
      
      if (errorElement && errorElement instanceof HTMLElement) {
        // Find the first focusable element within the field
        const focusableElement = errorElement.querySelector(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        
        if (focusableElement) {
          focusableElement.focus();
          
          // Scroll into view if needed
          focusableElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [isValid, validationResult.errors, autoFocusFirstError]);
  
  /**
   * Validate form on mount if requested
   */
  useEffect(() => {
    if (validateOnMount) {
      validateForm();
    }
  }, [validateOnMount, validateForm]);
  
  const errorMessages = getAllErrorMessages(validationResult);
  
  return (
    <div className={`form-validation-orchestrator ${className}`}>
      {showValidationSummary && errorMessages.length > 0 && (
        <ValidationSummary
          errors={errorMessages}
          className="mb-6"
        />
      )}
      
      {showValidationStatus && (
        <ValidationStatus
          isValid={isValid}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          className="mb-4"
        />
      )}
      
      {children}
    </div>
  );
};

/**
 * Props for ValidatedForm component
 */
export interface ValidatedFormProps {
  children: React.ReactNode;
  onSubmit: (values: Record<number, FieldValue>, isValid: boolean) => void | Promise<void>;
  onValidationChange?: (result: FormValidationResult) => void;
  showValidationSummary?: boolean;
  showValidationStatus?: boolean;
  validateOnMount?: boolean;
  autoFocusFirstError?: boolean;
  preventInvalidSubmit?: boolean;
  className?: string;
}

/**
 * Complete validated form component with orchestration
 */
export const ValidatedForm: React.FC<ValidatedFormProps> = ({
  children,
  onSubmit,
  onValidationChange,
  showValidationSummary = true,
  showValidationStatus = true,
  validateOnMount = false,
  autoFocusFirstError = true,
  preventInvalidSubmit = true,
  className = '',
}) => {
  const {
    isSubmitting,
    validateForm,
    getFormValues,
    setSubmitting,
  } = useFormValidationContext();
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Validate form before submission
      const formIsValid = await validateForm();
      const values = getFormValues();
      
      // Prevent submission if form is invalid and preventInvalidSubmit is true
      if (!formIsValid && preventInvalidSubmit) {
        return;
      }
      
      // Call onSubmit handler
      await onSubmit(values, formIsValid);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    isSubmitting,
    setSubmitting,
    validateForm,
    getFormValues,
    onSubmit,
    preventInvalidSubmit,
  ]);
  
  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <FormValidationOrchestrator
        onValidationChange={onValidationChange}
        showValidationSummary={showValidationSummary}
        showValidationStatus={showValidationStatus}
        validateOnMount={validateOnMount}
        autoFocusFirstError={autoFocusFirstError}
      >
        {children}
      </FormValidationOrchestrator>
    </form>
  );
};

/**
 * Props for FieldValidationHighlight component
 */
export interface FieldValidationHighlightProps {
  fieldId: number;
  children: React.ReactNode;
  className?: string;
  highlightClassName?: string;
}

/**
 * Component that highlights fields with validation errors
 */
export const FieldValidationHighlight: React.FC<FieldValidationHighlightProps> = ({
  fieldId,
  children,
  className = '',
  highlightClassName = 'ring-2 ring-red-500 ring-opacity-50',
}) => {
  const { hasFieldError, isFieldTouched } = useFormValidationContext();
  
  const hasError = hasFieldError(fieldId);
  const isTouched = isFieldTouched(fieldId);
  const shouldHighlight = hasError && isTouched;
  
  return (
    <div
      data-field-id={fieldId}
      className={`
        ${className}
        ${shouldHighlight ? highlightClassName : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  );
};

/**
 * Hook for form submission with validation
 */
export const useValidatedFormSubmit = (
  onSubmit: (values: Record<number, FieldValue>, isValid: boolean) => void | Promise<void>,
  options: {
    preventInvalidSubmit?: boolean;
    validateBeforeSubmit?: boolean;
  } = {}
) => {
  const {
    isValid,
    isSubmitting,
    validateForm,
    getFormValues,
    setSubmitting,
  } = useFormValidationContext();
  
  const {
    preventInvalidSubmit = true,
    validateBeforeSubmit = true,
  } = options;
  
  const submit = useCallback(async () => {
    if (isSubmitting) {
      return false;
    }
    
    setSubmitting(true);
    
    try {
      let formIsValid = isValid;
      
      // Validate form before submission if requested
      if (validateBeforeSubmit) {
        formIsValid = await validateForm();
      }
      
      // Prevent submission if form is invalid and preventInvalidSubmit is true
      if (!formIsValid && preventInvalidSubmit) {
        return false;
      }
      
      const values = getFormValues();
      await onSubmit(values, formIsValid);
      
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    isSubmitting,
    isValid,
    setSubmitting,
    validateBeforeSubmit,
    validateForm,
    preventInvalidSubmit,
    getFormValues,
    onSubmit,
  ]);
  
  return {
    submit,
    isSubmitting,
    isValid,
    canSubmit: !isSubmitting && (isValid || !preventInvalidSubmit),
  };
};
import type {
  InspectionField,
  FieldValue,
  ValidationRule,
  FieldValidationError,
  FormValidationResult,
} from '../types/inspection';
import {
  VALIDATION_PATTERNS,
  FIELD_VALIDATION_MESSAGES,
  INPUT_CONSTRAINTS,
  VALIDATION_RULES,
} from './constants';

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validation context for custom validation rules
 */
export interface ValidationContext {
  field: InspectionField;
  value: FieldValue;
  allValues?: Record<number, FieldValue>;
}

/**
 * Custom validation rule function
 */
export type CustomValidationRule = (context: ValidationContext) => string | null;

/**
 * Registry for custom validation rules
 */
const customValidationRules: Record<string, CustomValidationRule> = {};

/**
 * Register a custom validation rule
 */
export const registerValidationRule = (name: string, rule: CustomValidationRule): void => {
  customValidationRules[name] = rule;
};

/**
 * Format validation error message with parameters
 */
const formatErrorMessage = (message: string, parameters: Record<string, any> = {}): string => {
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return parameters[key]?.toString() || match;
  });
};

/**
 * Validate email format
 */
export const validateEmail = (value: string): string | null => {
  if (!value) return null;

  if (typeof value !== 'string') {
    return FIELD_VALIDATION_MESSAGES.EMAIL;
  }

  if (value.length > INPUT_CONSTRAINTS.EMAIL_MAX_LENGTH) {
    return formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX_LENGTH, {
      max: INPUT_CONSTRAINTS.EMAIL_MAX_LENGTH,
    });
  }

  if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
    return FIELD_VALIDATION_MESSAGES.EMAIL;
  }

  return null;
};

/**
 * Validate URL format
 */
export const validateURL = (value: string): string | null => {
  if (!value) return null;

  if (typeof value !== 'string') {
    return FIELD_VALIDATION_MESSAGES.URL;
  }

  if (value.length > INPUT_CONSTRAINTS.URL_MAX_LENGTH) {
    return formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX_LENGTH, {
      max: INPUT_CONSTRAINTS.URL_MAX_LENGTH,
    });
  }

  if (!VALIDATION_PATTERNS.URL.test(value)) {
    return FIELD_VALIDATION_MESSAGES.URL;
  }

  return null;
};

/**
 * Validate numeric value
 */
export const validateNumber = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return FIELD_VALIDATION_MESSAGES.NUMERIC;
  }

  if (numValue < INPUT_CONSTRAINTS.NUMBER_MIN || numValue > INPUT_CONSTRAINTS.NUMBER_MAX) {
    return formatErrorMessage('Value must be between {min} and {max}', {
      min: INPUT_CONSTRAINTS.NUMBER_MIN,
      max: INPUT_CONSTRAINTS.NUMBER_MAX,
    });
  }

  return null;
};

/**
 * Validate date value
 */
export const validateDate = (value: any): string | null => {
  if (!value) return null;

  let dateValue: Date;

  if (value instanceof Date) {
    dateValue = value;
  } else if (typeof value === 'string') {
    dateValue = new Date(value);
  } else {
    return FIELD_VALIDATION_MESSAGES.DATE;
  }

  if (isNaN(dateValue.getTime())) {
    return FIELD_VALIDATION_MESSAGES.DATE;
  }

  return null;
};

/**
 * Validate boolean value
 */
export const validateBoolean = (value: any): string | null => {
  if (value === null || value === undefined) return null;

  if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 0 && value !== 1) {
    return 'Please select a valid option';
  }

  return null;
};

/**
 * Validate text field with length constraints
 */
export const validateText = (value: any, minLength?: number, maxLength?: number): string | null => {
  if (!value) return null;

  if (typeof value !== 'string') {
    return 'Please enter valid text';
  }

  const length = value.length;
  const max = maxLength || INPUT_CONSTRAINTS.TEXT_MAX_LENGTH;

  if (minLength && length < minLength) {
    return formatErrorMessage(FIELD_VALIDATION_MESSAGES.MIN_LENGTH, { min: minLength });
  }

  if (length > max) {
    return formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX_LENGTH, { max });
  }

  return null;
};

/**
 * Validate textarea field with length constraints
 */
export const validateTextarea = (value: any, minLength?: number, maxLength?: number): string | null => {
  if (!value) return null;

  if (typeof value !== 'string') {
    return 'Please enter valid text';
  }

  const length = value.length;
  const max = maxLength || INPUT_CONSTRAINTS.TEXTAREA_MAX_LENGTH;

  if (minLength && length < minLength) {
    return formatErrorMessage(FIELD_VALIDATION_MESSAGES.MIN_LENGTH, { min: minLength });
  }

  if (length > max) {
    return formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX_LENGTH, { max });
  }

  return null;
};

/**
 * Validate select field value
 */
export const validateSelect = (value: any, options: string[] = []): string | null => {
  if (!value) return null;

  if (typeof value !== 'string') {
    return 'Please select a valid option';
  }

  if (options.length > 0 && !options.includes(value)) {
    return 'Please select a valid option from the list';
  }

  return null;
};

/**
 * Validate checkbox field values (array of strings)
 */
export const validateCheckbox = (value: any, options: string[] = []): string | null => {
  if (!value) return null;

  if (!Array.isArray(value)) {
    return 'Please select valid options';
  }

  if (options.length > 0) {
    const invalidOptions = value.filter(v => typeof v !== 'string' || !options.includes(v));
    if (invalidOptions.length > 0) {
      return 'Please select valid options from the list';
    }
  }

  return null;
};

/**
 * Validate radio field value
 */
export const validateRadio = (value: any, options: string[] = []): string | null => {
  return validateSelect(value, options);
};

/**
 * Apply validation rule with parameters
 */
const applyValidationRule = (
  rule: ValidationRule,
  value: FieldValue,
  context: ValidationContext
): string | null => {
  const { rule: ruleName, parameters = [], message } = rule;

  switch (ruleName) {
    case VALIDATION_RULES.REQUIRED:
      if (value === null || value === undefined || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
        return message || FIELD_VALIDATION_MESSAGES.REQUIRED;
      }
      break;

    case VALIDATION_RULES.EMAIL:
      return validateEmail(value as string);

    case VALIDATION_RULES.URL:
      return validateURL(value as string);

    case VALIDATION_RULES.NUMERIC:
      return validateNumber(value);

    case VALIDATION_RULES.DATE:
      return validateDate(value);

    case VALIDATION_RULES.BOOLEAN:
      return validateBoolean(value);

    case VALIDATION_RULES.MIN:
      if (typeof value === 'number' && parameters[0] && value < parameters[0]) {
        return message || formatErrorMessage(FIELD_VALIDATION_MESSAGES.MIN, { min: parameters[0] });
      }
      break;

    case VALIDATION_RULES.MAX:
      if (typeof value === 'number' && parameters[0] && value > parameters[0]) {
        return message || formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX, { max: parameters[0] });
      }
      break;

    case VALIDATION_RULES.MIN_LENGTH:
      if (typeof value === 'string' && parameters[0] && value.length < parameters[0]) {
        return message || formatErrorMessage(FIELD_VALIDATION_MESSAGES.MIN_LENGTH, { min: parameters[0] });
      }
      break;

    case VALIDATION_RULES.MAX_LENGTH:
      if (typeof value === 'string' && parameters[0] && value.length > parameters[0]) {
        return message || formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX_LENGTH, { max: parameters[0] });
      }
      break;

    case VALIDATION_RULES.REGEX:
      if (typeof value === 'string' && parameters[0]) {
        const regex = new RegExp(parameters[0]);
        if (!regex.test(value)) {
          return message || 'Please enter a value in the correct format';
        }
      }
      break;

    default:
      // Check for custom validation rules
      if (customValidationRules[ruleName]) {
        return customValidationRules[ruleName](context);
      }
      break;
  }

  return null;
};

/**
 * Validate a single field based on its type and validation rules
 */
export const validateField = (
  field: InspectionField,
  value: FieldValue,
  allValues?: Record<number, FieldValue>
): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const context: ValidationContext = { field, value, allValues };

  // Skip validation for inactive fields
  if (!field.is_active) {
    return { isValid: true, errors: [], warnings };
  }

  // Apply built-in field type validation
  let typeError: string | null = null;

  switch (field.field_type) {
    case 'email':
      typeError = validateEmail(value as string);
      break;
    case 'url':
      typeError = validateURL(value as string);
      break;
    case 'number':
      typeError = validateNumber(value);
      break;
    case 'date':
      typeError = validateDate(value);
      break;
    case 'boolean':
      typeError = validateBoolean(value);
      break;
    case 'text':
      typeError = validateText(value);
      break;
    case 'textarea':
      typeError = validateTextarea(value);
      break;
    case 'select':
      typeError = validateSelect(value as string, field.field_options?.options);
      break;
    case 'checkbox':
    case 'multiselect':
      typeError = validateCheckbox(value, field.field_options?.options);
      break;
    case 'radio':
      typeError = validateRadio(value as string, field.field_options?.options);
      break;
  }

  if (typeError) {
    errors.push(typeError);
  }

  // Apply required field validation
  if (field.is_required) {
    const requiredError = applyValidationRule(
      { rule: VALIDATION_RULES.REQUIRED },
      value,
      context
    );
    if (requiredError) {
      errors.push(requiredError);
    }
  }

  // Apply custom validation rules from field metadata
  if (field.validation_rules && Array.isArray(field.validation_rules)) {
    for (const rule of field.validation_rules) {
      const ruleError = applyValidationRule(rule, value, context);
      if (ruleError) {
        errors.push(ruleError);
      }
    }
  }

  // Apply field options constraints
  if (field.field_options) {
    const { min, max } = field.field_options;

    if (field.field_type === 'number' && typeof value === 'number') {
      if (min !== undefined && value < min) {
        errors.push(formatErrorMessage(FIELD_VALIDATION_MESSAGES.MIN, { min }));
      }
      if (max !== undefined && value > max) {
        errors.push(formatErrorMessage(FIELD_VALIDATION_MESSAGES.MAX, { max }));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: [...new Set(errors)], // Remove duplicates
    warnings: [...new Set(warnings)],
  };
};

/**
 * Validate multiple fields
 */
export const validateFields = (
  fields: InspectionField[],
  values: Record<number, FieldValue>
): FormValidationResult => {
  const fieldErrors: FieldValidationError[] = [];
  let isValid = true;

  for (const field of fields) {
    const fieldValue = values[field.id];
    const result = validateField(field, fieldValue, values);

    if (!result.isValid) {
      isValid = false;
      fieldErrors.push({
        field_id: field.id,
        field_name: field.name,
        errors: result.errors,
      });
    }
  }

  return {
    isValid,
    errors: fieldErrors,
  };
};

/**
 * Get validation error message for a specific field
 */
export const getFieldErrorMessage = (
  fieldId: number,
  validationResult: FormValidationResult
): string | undefined => {
  const fieldError = validationResult.errors.find(error => error.field_id === fieldId);
  return fieldError?.errors[0]; // Return first error message
};

/**
 * Check if a field has validation errors
 */
export const hasFieldError = (
  fieldId: number,
  validationResult: FormValidationResult
): boolean => {
  return validationResult.errors.some(error => error.field_id === fieldId);
};

/**
 * Get all error messages as a flat array
 */
export const getAllErrorMessages = (validationResult: FormValidationResult): string[] => {
  return validationResult.errors.flatMap(error => error.errors);
};

/**
 * Validate a single field value quickly (for real-time validation)
 */
export const validateFieldValue = (
  field: InspectionField,
  value: FieldValue
): string | null => {
  const result = validateField(field, value);
  return result.errors[0] || null;
};

/**
 * Check if a value is empty for validation purposes
 */
export const isEmpty = (value: FieldValue): boolean => {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
};

/**
 * Whether the field counts as "answered" for section / form progress (aligned with isEmpty).
 */
export const isFieldValueAnswered = (value: FieldValue): boolean => !isEmpty(value);

/**
 * Sanitize field value based on field type
 */
export const sanitizeFieldValue = (field: InspectionField, value: FieldValue): FieldValue => {
  switch (field.field_type) {
    case 'number':
      if (isEmpty(value)) return null;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      }
      return typeof value === 'number' ? value : null;

    case 'boolean':
      if (isEmpty(value)) return null;
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === 1) return true;
      if (value === 'false' || value === 0) return false;
      return null;

    case 'date':
      if (isEmpty(value)) return null;
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;

    case 'checkbox':
    case 'multiselect':
      if (isEmpty(value)) return [];
      if (Array.isArray(value)) {
        const filtered = value.filter(v => typeof v === 'string' && v.trim() !== '');
        return filtered.length > 0 ? filtered : [];
      }
      if (typeof value === 'string') {
        // Handle comma-separated string values
        const items = value.split(',').map(v => v.trim()).filter(v => v);
        return items.length > 0 ? items : [];
      }
      // Handle other value types by converting to string array
      if (value !== null && value !== undefined) {
        return [String(value)];
      }
      return [];

    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
    case 'select':
    case 'radio':
      if (isEmpty(value)) return '';
      // Do NOT trim text and textarea values here because this is called on every change
      // and trimming prevents users from entering spaces at the end of the input.
      if (field.field_type === 'text' || field.field_type === 'textarea') {
        return typeof value === 'string' ? value : String(value || '');
      }
      return typeof value === 'string' ? value.trim() : String(value || '');

    default:
      return value;
  }
};
/**
 *
 File validation utilities
 */

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, allowedTypes: readonly string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file for upload
 */
export const validateFileForUpload = (
  file: File,
  maxSizeMB: number,
  allowedTypes: readonly string[]
): { isValid: boolean; error?: string } => {
  if (!validateFileSize(file, maxSizeMB)) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
};
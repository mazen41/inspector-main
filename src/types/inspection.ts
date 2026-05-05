export interface Inspection {
  id: number;
  actions: InspectionActions;
  inspection_number: string;
  status: InspectionStatus;
  scheduled_at: string | null;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  car: Car;
  sections?: InspectionSection[];
  inspection_type: InspectionType;
  customer: Customer;
  photos?: InspectionPhoto[];
  report_url?: string;
  created_at: string;
  updated_at: string;
}

export type InspectionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type InspectionActions = {
  can_start: boolean,
  can_complete: boolean,
  can_cancel: boolean,
  is_editable: boolean
};
export interface Car {
  id: number;
  name: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  vin?: string;
  license_plate?: string;
  fuel_type?: string;
  transmission_type?: string;
}

export interface InspectionType {
  id: number;
  name: string;
  description?: string;
  price: number;
  estimated_duration: number;
  sections: InspectionSection[];
}

export interface InspectionSection {
  id: number;
  name: string;
  description?: string;
  fields: InspectionField[];
}

export interface InspectionField {
  id: number;
  section_id?: number;
  name: string;
  slug?: string;
  description?: string;
  field_type?: FieldType;
  field_options?: FieldOptions;
  is_required?: boolean;
  is_active?: boolean;
  sort_order?: number;
  placeholder?: string;
  help_text?: string;
  validation_rules?: ValidationRule[];
  metadata?: FieldMetadata;
  created_at?: string;
  updated_at?: string;
  // Computed properties from the model
  display_name?: string;
  field_type_display?: string;
  options?: string[];
  is_multiple?: boolean;
  has_options?: boolean;
  validation_rules_array?: string[];
  total_responses?: number;
  is_editable?: boolean;
  // Legacy support for existing code
  type?: FieldType; // Maps to field_type
  required?: boolean; // Maps to is_required
  // API response properties (when field values are included)
  value?: FieldValue;
  score?: number | null;
  notes?: string | null;
  is_flagged?: boolean;
  photos?: InspectionPhoto[];
  order?: number; // API uses 'order' instead of 'sort_order'
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'boolean'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'email'
  | 'url'
  // Legacy field types for backward compatibility
  | 'multiselect' // Will be mapped to checkbox
  | 'photo'; // Will be handled separately

export interface FieldOptions {
  options?: string[];
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  format?: string;
  [key: string]: any;
}

export interface ValidationRule {
  rule: string;
  parameters?: any[];
  message?: string;
}

export interface FieldMetadata {
  width?: 'full' | 'half' | 'third' | 'quarter';
  conditional_logic?: ConditionalLogic;
  styling?: FieldStyling;
  [key: string]: any;
}

export interface ConditionalLogic {
  show_if?: ConditionalRule[];
  hide_if?: ConditionalRule[];
}

export interface ConditionalRule {
  field_id: number;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface FieldStyling {
  css_class?: string;
  inline_style?: Record<string, string>;
}


export type FieldValue =
  | string
  | number
  | boolean
  | string[]
  | Date
  | null
  | undefined;

export interface FieldValidationError {
  field_id: number;
  field_name: string;
  errors: string[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
  warnings?: FieldValidationError[];
}

export interface InspectionPhoto {
  id: number;
  field_id?: number;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  uploaded_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

import type { ApiFilters, DateRangeFilter } from './api';

export interface InspectionFilters extends ApiFilters, DateRangeFilter {
  status?: InspectionStatus;
  car_brand?: string;
  inspection_type_id?: number;
}

// Field rendering and form handling types
export interface FieldComponentProps {
  field: InspectionField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface FieldRendererProps extends FieldComponentProps {
  showLabel?: boolean;
  showHelp?: boolean;
  showRequired?: boolean;
  className?: string;
}

export interface FormFieldState {
  value: FieldValue;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface InspectionFormState {
  fields: Record<number, FormFieldState>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  lastSaved?: Date;
}

// Field statistics and analytics types
export interface FieldStatistics {
  total_responses: number;
  response_rate: number;
  field_type: FieldType;
  is_required: boolean;
  value_distribution?: Record<string, number>;
  numeric_stats?: NumericFieldStats;
  checkbox_stats?: CheckboxFieldStats;
}

export interface NumericFieldStats {
  min: number;
  max: number;
  average: number;
  median: number;
}

export interface CheckboxFieldStats {
  value_distribution: Record<string, number>;
  total_selections: number;
}

// Utility types for field handling
export type FieldTypeWithOptions = 'select' | 'checkbox' | 'radio' | 'multiselect';
export type FieldTypeWithValidation = 'email' | 'url' | 'number' | 'date';
export type FieldTypeMultiValue = 'checkbox' | 'multiselect';

// Helper type guards
export const isFieldTypeWithOptions = (type: FieldType): type is FieldTypeWithOptions => {
  return ['select', 'checkbox', 'radio', 'multiselect'].includes(type);
};

export const isFieldTypeWithValidation = (type: FieldType): type is FieldTypeWithValidation => {
  return ['email', 'url', 'number', 'date'].includes(type);
};

export const isFieldTypeMultiValue = (type: FieldType): type is FieldTypeMultiValue => {
  return ['checkbox', 'multiselect'].includes(type);
};

// Field type mapping utilities
export const getFieldType = (field: InspectionField): FieldType => {
  return field.field_type || field.type || 'text';
};

export const getFieldRequired = (field: InspectionField): boolean => {
  return field.is_required ?? field.required ?? false;
};
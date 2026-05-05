import type { FieldValue, FieldType, InspectionField } from '../types/inspection';

/**
 * Format field values for display in inspection details
 * 
 * This utility handles formatting field values from the API response where
 * field values are embedded directly in the field objects within sections,
 * rather than in a separate field_values array.
 */

export const formatFieldValue = (
  value: FieldValue,
  field: InspectionField
): string => {
  const fieldType = field.field_type || field.type || 'text';
  
  // Handle null/undefined values
  if (value === null || value === undefined || value === '') {
    return getEmptyValueMessage(fieldType);
  }

  switch (fieldType) {
    case 'boolean':
      return formatBooleanValue(value);
    
    case 'checkbox':
    case 'multiselect':
      return formatCheckboxValue(value);
    
    case 'date':
      return formatDateValue(value);
    
    case 'number':
      return formatNumberValue(value);
    
    case 'email':
      return formatEmailValue(value);
    
    case 'url':
      return formatUrlValue(value);
    
    case 'select':
    case 'radio':
      return formatSelectValue(value);
    
    case 'text':
    case 'textarea':
    default:
      return formatTextValue(value);
  }
};

/**
 * Format boolean field values as Yes/No
 */
export const formatBooleanValue = (value: FieldValue): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return 'Yes';
    }
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return 'No';
    }
  }
  
  if (typeof value === 'number') {
    return value === 1 ? 'Yes' : 'No';
  }
  
  return String(value);
};

/**
 * Format checkbox/multiselect field values as comma-separated list
 */
export const formatCheckboxValue = (value: FieldValue): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'None selected';
    }
    return value.filter(v => v !== null && v !== undefined && v !== '').join(', ');
  }
  
  if (typeof value === 'string') {
    // Handle JSON string arrays
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return formatCheckboxValue(parsed);
      }
    } catch {
      // If not JSON, treat as comma-separated string
      const items = value.split(',').map(item => item.trim()).filter(item => item);
      return items.length > 0 ? items.join(', ') : 'None selected';
    }
  }
  
  return String(value);
};

/**
 * Format date values for readable display
 */
export const formatDateValue = (value: FieldValue): string => {
  if (!value) return 'No date set';
  
  let date: Date;
  
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    return String(value);
  }
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format number values with proper formatting
 */
export const formatNumberValue = (value: FieldValue): string => {
  if (typeof value === 'number') {
    // Check if it's an integer or has decimal places
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    } else {
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    }
  }
  
  if (typeof value === 'string') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return formatNumberValue(numValue);
    }
  }
  
  return String(value);
};

/**
 * Format email values with mailto link capability
 */
export const formatEmailValue = (value: FieldValue): string => {
  if (typeof value === 'string' && value.includes('@')) {
    return value;
  }
  
  return String(value);
};

/**
 * Format URL values
 */
export const formatUrlValue = (value: FieldValue): string => {
  if (typeof value === 'string') {
    // Add protocol if missing
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      return `https://${value}`;
    }
    return value;
  }
  
  return String(value);
};

/**
 * Format select/radio values
 */
export const formatSelectValue = (value: FieldValue): string => {
  return String(value);
};

/**
 * Format text values
 */
export const formatTextValue = (value: FieldValue): string => {
  return String(value);
};

/**
 * Get appropriate empty value message based on field type
 */
export const getEmptyValueMessage = (fieldType: FieldType): string => {
  switch (fieldType) {
    case 'boolean':
      return 'Not answered';
    case 'checkbox':
    case 'multiselect':
      return 'None selected';
    case 'date':
      return 'No date set';
    case 'email':
      return 'No email provided';
    case 'url':
      return 'No URL provided';
    case 'number':
      return 'No value entered';
    case 'select':
    case 'radio':
      return 'Not selected';
    case 'text':
    case 'textarea':
    default:
      return 'No value entered';
  }
};

/**
 * Check if a field value is considered empty
 */
export const isFieldValueEmpty = (value: FieldValue): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  
  return false;
};

/**
 * Get display-friendly field type name
 */
export const getFieldTypeDisplayName = (fieldType: FieldType): string => {
  switch (fieldType) {
    case 'text':
      return 'Text';
    case 'textarea':
      return 'Long Text';
    case 'boolean':
      return 'Yes/No';
    case 'number':
      return 'Number';
    case 'select':
      return 'Dropdown';
    case 'checkbox':
    case 'multiselect':
      return 'Multiple Choice';
    case 'radio':
      return 'Single Choice';
    case 'date':
      return 'Date';
    case 'email':
      return 'Email';
    case 'url':
      return 'URL';
    case 'photo':
      return 'Photo';
    default:
      return 'Unknown';
  }
};

/**
 * Format field value for display with HTML support (for links, etc.)
 */
export const formatFieldValueWithHtml = (
  value: FieldValue,
  field: InspectionField
): { text: string; isHtml: boolean; href?: string } => {
  const fieldType = field.field_type || field.type || 'text';
  const formattedText = formatFieldValue(value, field);
  
  // Handle email fields
  if (fieldType === 'email' && typeof value === 'string' && value.includes('@')) {
    return {
      text: formattedText,
      isHtml: true,
      href: `mailto:${value}`
    };
  }
  
  // Handle URL fields
  if (fieldType === 'url' && typeof value === 'string' && value) {
    const url = formatUrlValue(value);
    return {
      text: formattedText,
      isHtml: true,
      href: url
    };
  }
  
  return {
    text: formattedText,
    isHtml: false
  };
};
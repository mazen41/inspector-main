import type { FieldValue, FieldType } from '../types';

/**
 * Transform field value for API submission
 * Ensures proper serialization of different field types
 */
export const transformFieldValueForAPI = (value: FieldValue): any => {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle Date objects - convert to ISO string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle arrays (checkbox/multiselect fields)
  if (Array.isArray(value)) {
    return value.filter(v => v !== null && v !== undefined && v !== '');
  }

  // Handle boolean values
  if (typeof value === 'boolean') {
    return value;
  }

  // Handle numeric values
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  // Handle string values - trim whitespace
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  return value;
};

/**
 * Transform field value from API response
 * Ensures proper deserialization of different field types
 */
export const transformFieldValueFromAPI = (value: any, fieldType?: FieldType): FieldValue => {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle date fields
  if (fieldType === 'date' && typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle checkbox/multiselect fields
  if (fieldType === 'checkbox' || fieldType === 'multiselect') {
    if (Array.isArray(value)) {
      return value;
    }
    // Handle case where API returns comma-separated string
    if (typeof value === 'string') {
      return value.split(',').map(v => v.trim()).filter(v => v !== '');
    }
    return [];
  }

  // Handle boolean fields
  if (fieldType === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }

  // Handle numeric fields
  if (fieldType === 'number') {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  return value;
};

/**
 * Test field value transformations
 */
export const testFieldValueTransformations = () => {
  const testCases = [
    // Date field tests
    { value: new Date('2024-01-01'), fieldType: 'date' as FieldType, expected: '2024-01-01T00:00:00.000Z' },
    { value: '2024-01-01T10:30:00Z', fieldType: 'date' as FieldType, expected: new Date('2024-01-01T10:30:00Z') },

    // Boolean field tests
    { value: true, fieldType: 'boolean' as FieldType, expected: true },
    { value: 'true', fieldType: 'boolean' as FieldType, expected: true },
    { value: '1', fieldType: 'boolean' as FieldType, expected: true },
    { value: 1, fieldType: 'boolean' as FieldType, expected: true },
    { value: false, fieldType: 'boolean' as FieldType, expected: false },

    // Number field tests
    { value: 42, fieldType: 'number' as FieldType, expected: 42 },
    { value: '42.5', fieldType: 'number' as FieldType, expected: 42.5 },
    { value: 'invalid', fieldType: 'number' as FieldType, expected: null },

    // Checkbox field tests
    { value: ['option1', 'option2'], fieldType: 'checkbox' as FieldType, expected: ['option1', 'option2'] },
    { value: 'option1,option2', fieldType: 'checkbox' as FieldType, expected: ['option1', 'option2'] },

    // String field tests
    { value: '  test  ', fieldType: 'text' as FieldType, expected: null }, // API transform trims and converts empty to null
    { value: 'test', fieldType: 'text' as FieldType, expected: 'test' },

    // Null/undefined tests
    { value: null, fieldType: 'text' as FieldType, expected: null },
    { value: undefined, fieldType: 'text' as FieldType, expected: null },
  ];

  console.log('Testing field value transformations...');

  testCases.forEach((testCase, index) => {
    // Test API transformation
    const apiResult = transformFieldValueForAPI(testCase.value);

    // Test reverse transformation
    const reverseResult = transformFieldValueFromAPI(apiResult, testCase.fieldType);

    console.log(`Test ${index + 1}:`, {
      original: testCase.value,
      fieldType: testCase.fieldType,
      apiTransform: apiResult,
      reverseTransform: reverseResult,
      expected: testCase.expected,
    });
  });

  console.log('Field value transformation tests completed.');
};
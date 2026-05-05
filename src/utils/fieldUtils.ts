import type { InspectionField, ConditionalRule, FieldValue } from '../types/inspection';

/**
 * Sort fields by their sort_order property
 */
export const sortFieldsByOrder = (fields: InspectionField[]): InspectionField[] => {
    return [...fields].sort((a, b) => {
        const orderA = a.sort_order ?? 999;
        const orderB = b.sort_order ?? 999;

        // Primary sort by sort_order
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Secondary sort by field name for consistent ordering
        return a.name.localeCompare(b.name);
    });
};

/**
 * Filter out inactive fields from display
 */
export const filterActiveFields = (fields: InspectionField[]): InspectionField[] => {
    return fields.filter(field => field.is_active !== false);
};

/**
 * Check if a field should be visible based on conditional logic
 */
export const isFieldVisible = (
    field: InspectionField,
    fieldValues: Record<number, FieldValue>
): boolean => {
    const conditionalLogic = field.metadata?.conditional_logic;

    if (!conditionalLogic) {
        return true; // No conditional logic means always visible
    }

    // Check show_if conditions
    if (conditionalLogic.show_if && conditionalLogic.show_if.length > 0) {
        const shouldShow = conditionalLogic.show_if.some(rule =>
            evaluateConditionalRule(rule, fieldValues)
        );
        if (!shouldShow) {
            return false;
        }
    }

    // Check hide_if conditions
    if (conditionalLogic.hide_if && conditionalLogic.hide_if.length > 0) {
        const shouldHide = conditionalLogic.hide_if.some(rule =>
            evaluateConditionalRule(rule, fieldValues)
        );
        if (shouldHide) {
            return false;
        }
    }

    return true;
};

/**
 * Evaluate a single conditional rule
 */
export const evaluateConditionalRule = (
    rule: ConditionalRule,
    fieldValues: Record<number, FieldValue>
): boolean => {
    const fieldValue = fieldValues[rule.field_id];
    const ruleValue = rule.value;

    switch (rule.operator) {
        case 'equals':
            return fieldValue === ruleValue;

        case 'not_equals':
            return fieldValue !== ruleValue;

        case 'contains':
            if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
                return fieldValue.toLowerCase().includes(ruleValue.toLowerCase());
            }
            if (Array.isArray(fieldValue)) {
                return fieldValue.includes(ruleValue);
            }
            return false;

        case 'not_contains':
            if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
                return !fieldValue.toLowerCase().includes(ruleValue.toLowerCase());
            }
            if (Array.isArray(fieldValue)) {
                return !fieldValue.includes(ruleValue);
            }
            return true;

        case 'greater_than':
            if (typeof fieldValue === 'number' && typeof ruleValue === 'number') {
                return fieldValue > ruleValue;
            }
            return false;

        case 'less_than':
            if (typeof fieldValue === 'number' && typeof ruleValue === 'number') {
                return fieldValue < ruleValue;
            }
            return false;

        default:
            console.warn(`Unknown conditional operator: ${rule.operator}`);
            return true;
    }
};

/**
 * Process fields for display: filter inactive, sort by order, and apply visibility rules
 */
export const processFieldsForDisplay = (
    fields: InspectionField[],
    fieldValues: Record<number, FieldValue> = {}
): InspectionField[] => {
    return sortFieldsByOrder(
        filterActiveFields(fields).filter(field =>
            isFieldVisible(field, fieldValues)
        )
    );
};

/**
 * Group fields by section and process them for display
 */
export const groupFieldsBySection = (
    fields: InspectionField[],
    fieldValues: Record<number, FieldValue> = {}
): Record<number, InspectionField[]> => {
    const processedFields = processFieldsForDisplay(fields, fieldValues);

    return processedFields.reduce((groups, field) => {
        const sectionId = field.section_id;
        if (sectionId !== undefined) {
            if (!groups[sectionId]) {
                groups[sectionId] = [];
            }
            groups[sectionId].push(field);
        }
        return groups;
    }, {} as Record<number, InspectionField[]>);
};

/**
 * Check if a field has options (for select, radio, checkbox fields)
 */
export const fieldHasOptions = (field: InspectionField): boolean => {
    const fieldType = field.field_type || field.type;
    const hasOptionsType = ['select', 'radio', 'checkbox', 'multiselect'].includes(fieldType || '');
    const hasOptions = Boolean(field.field_options?.options && field.field_options.options.length > 0);
    const hasLegacyOptions = Boolean(field.options && field.options.length > 0);

    return hasOptionsType && (hasOptions || hasLegacyOptions);
};

/**
 * Get field options from either new or legacy format
 */
export const getFieldOptions = (field: InspectionField): string[] => {
    // Try new format first
    if (field.field_options?.options && field.field_options.options.length > 0) {
        return field.field_options.options;
    }

    // Fall back to legacy format
    if (field.options && field.options.length > 0) {
        return field.options;
    }

    return [];
};

/**
 * Check if a field supports multiple values (checkbox, multiselect)
 */
export const isMultiValueField = (field: InspectionField): boolean => {
    const fieldType = field.field_type || field.type;
    return ['checkbox', 'multiselect'].includes(fieldType || '');
};

/**
 * Validate field visibility dependencies
 * Returns fields that have unmet dependencies
 */
export const validateFieldDependencies = (
    fields: InspectionField[]
): { field: InspectionField; missingDependencies: number[] }[] => {
    const fieldIds = new Set(fields.map(f => f.id));
    const issues: { field: InspectionField; missingDependencies: number[] }[] = [];

    fields.forEach(field => {
        const conditionalLogic = field.metadata?.conditional_logic;
        if (!conditionalLogic) return;

        const missingDependencies: number[] = [];

        // Check show_if dependencies
        conditionalLogic.show_if?.forEach(rule => {
            if (!fieldIds.has(rule.field_id)) {
                missingDependencies.push(rule.field_id);
            }
        });

        // Check hide_if dependencies
        conditionalLogic.hide_if?.forEach(rule => {
            if (!fieldIds.has(rule.field_id)) {
                missingDependencies.push(rule.field_id);
            }
        });

        if (missingDependencies.length > 0) {
            issues.push({ field, missingDependencies });
        }
    });

    return issues;
};
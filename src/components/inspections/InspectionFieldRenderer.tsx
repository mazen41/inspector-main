import React from 'react';
import {
  TextFieldComponent,
  TextareaFieldComponent,
  BooleanFieldComponent,
  NumberFieldComponent,
  SelectFieldComponent,
  CheckboxFieldComponent,
  RadioFieldComponent,
  DateFieldComponent,
  EmailFieldComponent,
  URLFieldComponent,
} from './fields';
import FieldPhotoUpload from './FieldPhotoUpload';
import type {
  InspectionField,
  FieldValue,
  FieldRendererProps,
  InspectionPhoto,
} from '../../types/inspection';
import { getFieldType, getFieldRequired } from '../../types/inspection';

interface InspectionFieldRendererProps extends Omit<FieldRendererProps, 'field'> {
  field: InspectionField;
  value: FieldValue;
  currentNotes?: string;
  currentPhotos?: InspectionPhoto[];
  photoError?: string;
  inspectionId?: number;
  onChange: (value: FieldValue) => void;
  onBlur?: () => void;
  onNotesChange?: (fieldId: number, notes: string) => void;
  onPhotosChange?: (fieldId: number, photos: InspectionPhoto[]) => void;
  onPhotoClick?: (photo: InspectionPhoto) => void;
  onPhotoDelete?: (photoId: number) => void;
  error?: string;
  disabled?: boolean;
  showLabel?: boolean;
  showHelp?: boolean;
  showRequired?: boolean;
  enablePhotoUpload?: boolean;
  forceArabicPhotoUpload?: boolean;
  className?: string;
}

const InspectionFieldRenderer: React.FC<InspectionFieldRendererProps> = React.memo(({
  field,
  value,
  currentNotes = '',
  currentPhotos = [],
  photoError,
  inspectionId,
  onChange,
  onBlur,
  onNotesChange,
  onPhotosChange,
  onPhotoClick,
  onPhotoDelete,
  error,
  disabled = false,
  showLabel = true,
  showHelp = true,
  showRequired = true,
  enablePhotoUpload = false,
  forceArabicPhotoUpload = false,
  className = '',
}) => {
  const fieldType = getFieldType(field);
  const isRequired = getFieldRequired(field);

  // Memoize accessibility attributes to avoid recalculation on every render
  const accessibilityAttributes = React.useMemo(() => {
    const attributes: Record<string, string> = {
      id: `field-${field.id}`,
      'aria-labelledby': `label-${field.id}`,
    };

    if (field.help_text && showHelp) {
      attributes['aria-describedby'] = `help-${field.id}`;
    }

    if (error) {
      attributes['aria-describedby'] = attributes['aria-describedby']
        ? `${attributes['aria-describedby']} error-${field.id}`
        : `error-${field.id}`;
      attributes['aria-invalid'] = 'true';
    }

    if (isRequired) {
      attributes['aria-required'] = 'true';
    }

    return attributes;
  }, [field.id, field.help_text, showHelp, error, isRequired]);

  // Memoize field wrapper class name
  const fieldWrapperClassName = React.useMemo(() => {
    const baseClasses = 'field-wrapper';
    const widthClasses: Record<string, string> = {
      full: 'w-full',
      half: 'w-1/2',
      third: 'w-1/3',
      quarter: 'w-1/4',
    };

    const width = field.metadata?.width || 'full';
    const widthClass = widthClasses[width] || widthClasses.full;
    const customClass = field.metadata?.styling?.css_class || '';

    return `${baseClasses} ${widthClass} ${customClass} ${className}`.trim();
  }, [field.metadata?.width, field.metadata?.styling?.css_class, className]);

  // Memoize inline styles
  const inlineStyles = React.useMemo(() => {
    return field.metadata?.styling?.inline_style || {};
  }, [field.metadata?.styling?.inline_style]);

  // Handle notes change
  const handleNotesChange = React.useCallback((notes: string) => {
    if (onNotesChange) {
      onNotesChange(field.id, notes);
    }
  }, [field.id, onNotesChange]);

  // Handle photos change
  const handlePhotosChange = React.useCallback((photos: InspectionPhoto[]) => {
    if (onPhotosChange) {
      onPhotosChange(field.id, photos);
    }
  }, [field.id, onPhotosChange]);

  // Field type detection and component selection - memoized to avoid recalculation
  const fieldComponent = React.useMemo(() => {
    const commonProps = {
      field,
      value,
      onChange,
      onBlur,
      error,
      disabled,
      required: isRequired,
    };

    // Add notes props for all field types except text and textarea
    const shouldShowNotes = fieldType !== 'text' && fieldType !== 'textarea';
    const notesProps = shouldShowNotes ? {
      notes: currentNotes || null,
      onNotesChange: handleNotesChange,
    } : {};

    const propsWithNotes = { ...commonProps, ...notesProps };

    switch (fieldType) {
      case 'text':
        return <TextFieldComponent {...commonProps} />;
      case 'textarea':
        return <TextareaFieldComponent {...commonProps} />;
      case 'boolean':
        return <BooleanFieldComponent {...propsWithNotes} />;
      case 'number':
        return <NumberFieldComponent {...propsWithNotes} />;
      case 'select':
        return <SelectFieldComponent {...propsWithNotes} />;
      case 'checkbox':
      case 'multiselect': // Legacy support
        return <CheckboxFieldComponent {...propsWithNotes} />;
      case 'radio':
        return <RadioFieldComponent {...propsWithNotes} />;
      case 'date':
        return <DateFieldComponent {...propsWithNotes} />;
      case 'email':
        return <EmailFieldComponent {...propsWithNotes} />;
      case 'url':
        return <URLFieldComponent {...propsWithNotes} />;
      default:
        console.warn(`Unsupported field type: ${fieldType}. Falling back to text field.`);
        return <TextFieldComponent {...commonProps} />;
    }
  }, [field, value, onChange, onBlur, error, disabled, isRequired, fieldType, currentNotes, handleNotesChange]);

  // Render required indicator
  const renderRequiredIndicator = () => {
    if (!showRequired || !isRequired) return null;
    return (
      <span
        className="text-red-500 ml-1"
        aria-label="Required field"
        title="This field is required"
      >
        *
      </span>
    );
  };

  // Render help text
  const renderHelpText = () => {
    if (!showHelp || !field.help_text) return null;
    return (
      <div className="mt-1 text-sm text-gray-600" id={`help-${field.id}`}>
        {field.help_text}
      </div>
    );
  };

  // Render field label
  const renderLabel = () => {
    if (!showLabel) return null;

    const labelId = `label-${field.id}`;
    const fieldId = `field-${field.id}`;

    return (
      <label
        id={labelId}
        htmlFor={fieldId}
        className="block text-lg font-bold text-gray-700 mb-2"
      >
        {field.display_name || field.name}
        {renderRequiredIndicator()}
      </label>
    );
  };

  // Render validation error
  const renderError = () => {
    if (!error) return null;
    return (
      <div
        className="mt-1 text-sm text-red-600"
        id={`error-${field.id}`}
        role="alert"
        aria-live="polite"
      >
        {error}
      </div>
    );
  };

  // Render photo upload component
  const renderPhotoUpload = () => {
    if (!enablePhotoUpload || !inspectionId || !onPhotosChange) {
      return null;
    }

    return (
      <div className="mt-3">
        <FieldPhotoUpload
          inspectionId={inspectionId}
          fieldId={field.id}
          photos={currentPhotos}
          onPhotosChange={handlePhotosChange}
          onPhotoClick={onPhotoClick}
          onPhotoDelete={onPhotoDelete}
          disabled={disabled}
          forceArabic={forceArabicPhotoUpload}
          className="field-photo-upload-wrapper"
        />
        {photoError && (
          <div
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {photoError}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={fieldWrapperClassName}
      style={inlineStyles}
      data-field-id={field.id}
      data-field-type={fieldType}
      data-testid={`field-renderer-${field.id}`}
    >
      {renderLabel()}
      <div className="field-input-wrapper" {...accessibilityAttributes}>
        {fieldComponent}
      </div>
      {renderPhotoUpload()}
      {renderHelpText()}
      {renderError()}
      
      {/* Field separator */}
      <div className="mt-6 mb-4 border-b border-gray-200" aria-hidden="true" />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo to prevent unnecessary re-renders
  return (
    prevProps.field.id === nextProps.field.id &&
    prevProps.value === nextProps.value &&
    prevProps.currentNotes === nextProps.currentNotes &&
    prevProps.currentPhotos?.length === nextProps.currentPhotos?.length &&
    prevProps.error === nextProps.error &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.photoError === nextProps.photoError
  );
});

export default InspectionFieldRenderer;

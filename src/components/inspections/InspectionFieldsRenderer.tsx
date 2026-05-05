import React from 'react';
import InspectionFieldRenderer from './InspectionFieldRenderer';
import InspectionSectionHeader from './InspectionSectionHeader';
import type {
  InspectionSection,
  FieldValue,
  InspectionFormState,
  InspectionPhoto,
} from '../../types/inspection';
import {
  processFieldsForDisplay,
  validateFieldDependencies,
} from '../../utils/fieldUtils';

interface InspectionFieldsRendererProps {
  sections: InspectionSection[];
  formState: InspectionFormState;
  fieldNotes?: Record<number, string>;
  fieldPhotos?: Record<number, InspectionPhoto[]>;
  photoErrors?: Record<number, string>;
  inspectionId?: number;
  onFieldChange: (fieldId: number, value: FieldValue) => void;
  onFieldBlur?: (fieldId: number) => void;
  onNotesChange?: (fieldId: number, notes: string) => void;
  onPhotosChange?: (fieldId: number, photos: InspectionPhoto[]) => void;
  onPhotoClick?: (photo: InspectionPhoto) => void;
  onPhotoDelete?: (photoId: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
  showHelp?: boolean;
  showRequired?: boolean;
  enablePhotoUpload?: boolean;
  className?: string;
}

const InspectionFieldsRenderer: React.FC<InspectionFieldsRendererProps> = ({
  sections,
  formState,
  fieldNotes = {},
  fieldPhotos = {},
  photoErrors = {},
  inspectionId,
  onFieldChange,
  onFieldBlur,
  onNotesChange,
  onPhotosChange,
  onPhotoClick,
  onPhotoDelete,
  disabled = false,
  showLabels = true,
  showHelp = true,
  showRequired = true,
  enablePhotoUpload = false,
  className = '',
}) => {
  // Extract field values for conditional logic evaluation
  const fieldValues = React.useMemo(() => {
    const values: Record<number, FieldValue> = {};
    Object.entries(formState.fields).forEach(([fieldId, fieldState]) => {
      values[parseInt(fieldId)] = fieldState.value;
    });
    return values;
  }, [formState.fields]);

  // Memoize processed sections to avoid expensive visibility calculations on every render
  const processedSections = React.useMemo(() => {
    return sections.map(section => ({
      ...section,
      processedFields: processFieldsForDisplay(section.fields, fieldValues)
    })).filter(section => section.processedFields.length > 0);
  }, [sections, fieldValues]);

  // Validate field dependencies in development
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const allFields = sections.flatMap(section => section.fields);
      const dependencyIssues = validateFieldDependencies(allFields);
      
      if (dependencyIssues.length > 0) {
        console.warn('Field dependency issues found:', dependencyIssues);
      }
    }
  }, [sections]);

  // Render a single section with its fields
  const renderSection = (section: InspectionSection & { processedFields: any[] }) => {
    const { processedFields } = section;
    
    if (processedFields.length === 0) {
      return null; // Don't render empty sections
    }

    return (
      <div 
        key={section.id} 
        className="inspection-section mb-8"
        data-section-id={section.id}
        data-testid={`section-${section.id}`}
      >
        {/* Section header with progress indicators */}
        <InspectionSectionHeader 
          section={section}
          formState={formState}
        />
        
        {/* Section fields in improved grid layout */}
        <div className="section-fields bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full overflow-hidden">
            {processedFields.map(field => {
              const fieldState = formState.fields[field.id];
              const fieldValue = (fieldState?.value !== undefined) ? fieldState.value : field.value;
              const fieldError = fieldState?.error;
              
              // Determine field width based on metadata or field type
              const fieldWidth = field.metadata?.width || 'full';
              const fieldSpanClass: Record<string, string> = {
                'full': 'col-span-1 sm:col-span-2 lg:col-span-3',
                'half': 'col-span-1 sm:col-span-1 lg:col-span-1',
                'third': 'col-span-1 sm:col-span-1 lg:col-span-1',
                'quarter': 'col-span-1 sm:col-span-1 lg:col-span-1',
              };
              const spanClass = fieldSpanClass[fieldWidth] || fieldSpanClass['full'];

              // Special handling for textarea and long text fields
              const isLongField = field.field_type === 'textarea' || 
                                 field.type === 'textarea' ||
                                 fieldWidth === 'full';

              return (
                <div 
                  key={field.id}
                  className={`field-item w-full max-w-full min-w-0 ${isLongField ? 'col-span-1 sm:col-span-2 lg:col-span-3' : spanClass}`}
                >
                  <InspectionFieldRenderer
                    field={field}
                    value={fieldValue}
                    currentNotes={fieldNotes[field.id] || ''}
                    currentPhotos={fieldPhotos[field.id] || []}
                    photoError={photoErrors[field.id]}
                    inspectionId={inspectionId}
                    onChange={(value) => onFieldChange(field.id, value)}
                    onBlur={() => onFieldBlur?.(field.id)}
                    onNotesChange={onNotesChange}
                    onPhotosChange={onPhotosChange}
                    onPhotoClick={onPhotoClick}
                    onPhotoDelete={onPhotoDelete}
                    error={fieldError}
                    disabled={disabled}
                    showLabel={showLabels}
                    showHelp={showHelp}
                    showRequired={showRequired}
                    enablePhotoUpload={enablePhotoUpload}
                    className="h-full w-full max-w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Filter sections that have visible fields - already done in processedSections
  const visibleSections = processedSections;

  if (visibleSections.length === 0) {
    return (
      <div className="no-fields-message text-center py-8 text-gray-500">
        <p>No fields are available for this inspection.</p>
      </div>
    );
  }

  return (
    <div 
      className={`inspection-fields-renderer ${className}`}
      data-testid="inspection-fields-renderer"
    >
      {visibleSections.map(renderSection)}
    </div>
  );
};

export default InspectionFieldsRenderer;
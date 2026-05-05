import React, { useState } from 'react';
import { FileText, AlertCircle, ExternalLink, Mail, Camera } from 'lucide-react';
import type { 
  Inspection, 
  InspectionSection, 
  InspectionField,
  InspectionPhoto
} from '../../types/inspection';
import { 
  formatFieldValueWithHtml, 
  isFieldValueEmpty,
  getFieldTypeDisplayName 
} from '../../utils/fieldValueFormatters';
import { useTranslation } from '@/hooks';
import PhotoPreviewGrid from './PhotoPreviewGrid';
import PhotoModal from './PhotoModal';

interface InspectionFieldValuesProps {
  inspection: Inspection;
  className?: string;
  readOnly?: boolean;
}

interface FieldValueDisplayProps {
  field: InspectionField;
  readOnly?: boolean;
}

const FieldValueDisplay: React.FC<FieldValueDisplayProps> = ({ field, readOnly = true }) => {
  const displayValue = field.value;
  const isEmpty = isFieldValueEmpty(displayValue);
  const { text, isHtml, href } = formatFieldValueWithHtml(displayValue, field);
  const { t } = useTranslation();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handlePhotoClick = (photo: InspectionPhoto) => {
    if (!field.photos) return;
    const index = field.photos.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      setSelectedPhotoIndex(index);
      setIsPhotoModalOpen(true);
    }
  };

  const handlePhotoDelete = (_photoId: number) => {
    // In read-only mode, we don't allow deletion
    // This function is kept for interface compatibility
    console.log('Photo deletion not available in read-only mode');
  };
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {field.name}
              {field.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {getFieldTypeDisplayName(field.field_type || field.type || 'text')}
            </span>
            {field.is_flagged && (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded ml-1">
                {t('inspection.fields.flagged')}
              </span>
            )}
          </div>
          
          {field.description && (
            <p className="text-xs text-gray-600 mb-2">{field.description}</p>
          )}
          
          <div className="text-sm">
            {isEmpty ? (
              <span className="text-gray-400 italic">{text}</span>
            ) : isHtml && href ? (
              <a 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                {field.field_type === 'email' || field.type === 'email' ? (
                  <Mail className="h-3 w-3" />
                ) : (
                  <ExternalLink className="h-3 w-3" />
                )}
                {text}
              </a>
            ) : (
              <span className="text-gray-900 whitespace-pre-wrap">{text}</span>
            )}
          </div>
          
          {field.notes && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <span className="font-medium text-yellow-800">{t('inspection.fields.notes')}: </span>
              <span className="text-yellow-700">{field.notes}</span>
            </div>
          )}
          
          {field.photos && field.photos.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t('inspections.fields.photos')} ({field.photos.length})
                </span>
              </div>
              <PhotoPreviewGrid
                photos={field.photos}
                onPhotoClick={handlePhotoClick}
                onPhotoDelete={handlePhotoDelete}
                readOnly={readOnly}
              />
            </div>
          )}

          {/* Photo Modal */}
          {field.photos && field.photos.length > 0 && (
            <PhotoModal
              photos={field.photos}
              currentIndex={selectedPhotoIndex}
              isOpen={isPhotoModalOpen}
              onClose={() => setIsPhotoModalOpen(false)}
              readOnly={readOnly}
            />
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {field.is_required && isEmpty && (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          {field.score !== null && field.score !== undefined && (
            <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              Score: {field.score}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SectionDisplayProps {
  section: InspectionSection;
  isEmpty: boolean;
  readOnly?: boolean;
}

const SectionDisplay: React.FC<SectionDisplayProps> = ({ 
  section, 
  isEmpty,
  readOnly = true
}) => {
  // Sort fields by order (API uses 'order') or sort_order
  const sortedFields = [...section.fields].sort((a, b) => 
    (a.order || a.sort_order || 0) - (b.order || b.sort_order || 0)
  );

  // Filter out inactive fields (assume all fields from API are active unless specified)
  const activeFields = sortedFields.filter(field => field.is_active !== false);

  if (activeFields.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {section.name}
          </h3>
          {isEmpty && (
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              No data
            </span>
          )}
        </div>
        {section.description && (
          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
        )}
      </div>
      
      <div className="px-6 py-4">
        {(
          <div className="space-y-0">
            {activeFields.map(field => (
              <FieldValueDisplay
                key={field.id}
                field={field}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InspectionFieldValues: React.FC<InspectionFieldValuesProps> = ({ 
  inspection, 
  className = '',
  readOnly = true
}) => {
  // Use sections from the inspection response (which includes field values)
  // or fall back to inspection_type sections
  const sections = (inspection as any).sections || inspection.inspection_type?.sections || [];

  // Sort sections by their order (if available) or by name
  const sortedSections = [...sections].sort((a, b) => {
    // If sections have an order property, use it; otherwise sort by name
    if ('order' in a && 'order' in b) {
      return (a.order || 0) - (b.order || 0);
    }
    if ('sort_order' in a && 'sort_order' in b) {
      return ((a as any).sort_order || 0) - ((b as any).sort_order || 0);
    }
    return a.name.localeCompare(b.name);
  });

  if (sections.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Inspection Form Available
          </h3>
          <p className="text-gray-500">
            This inspection type doesn't have any configured fields to display.
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalFields = sections.reduce((total: number, section: InspectionSection) => 
    total + section.fields.filter((f: InspectionField) => f.is_active !== false).length, 0
  );
  const completedFields = sections.reduce((total: number, section: InspectionSection) => 
    total + section.fields.filter((f: InspectionField) => 
      f.is_active !== false && !isFieldValueEmpty(f.value)
    ).length, 0
  );
  const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const {t} = useTranslation();
  return (
    <div className={className}>
      {/* Header with completion stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {t('inspections.form.inspectionFields')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('inspections.form.progress.completedOf', { 
            completed: completedFields, 
            total: totalFields
          })}
             
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {completionPercentage}%
            </div>
            <div className="text-xs text-gray-500">{t('inspection.details.completed')}</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sortedSections.map(section => {
          // Check if section has any field values
          const sectionHasValues = section.fields
            .filter((f: InspectionField) => f.is_active !== false)
            .some((f: InspectionField) => !isFieldValueEmpty(f.value));

          return (
            <SectionDisplay
              key={section.id}
              section={section}
              isEmpty={!sectionHasValues}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {/* Empty state for no field values at all */}
      {completedFields === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Field Values Yet
            </h3>
            <p className="text-gray-500">
              Field values will appear here once the inspection form has been filled out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionFieldValues;
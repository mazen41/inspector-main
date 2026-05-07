import React, { useState, useCallback, useRef, useEffect } from 'react';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import FieldPhotoPreview from './FieldPhotoPreview';
import type { InspectionPhoto } from '../../types/inspection';
import { Camera, AlertCircle, CheckCircle, Upload, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { createImagePreview } from '../../utils/photoValidation';

interface FieldPhotoUploadProps {
  inspectionId?: number;
  fieldId: number;
  photos: InspectionPhoto[];
  onPhotosChange: (photos: InspectionPhoto[]) => void;
  onPhotoClick?: (photo: InspectionPhoto) => void;
  onPhotoDelete?: (photoId: number) => void;
  disabled?: boolean;
  maxPhotos?: number;
  className?: string;
  enableCompression?: boolean;
  showDetailedProgress?: boolean;
  readOnly?: boolean;
  forceArabic?: boolean;
}

const FieldPhotoUpload: React.FC<FieldPhotoUploadProps> = ({
  inspectionId,
  fieldId,
  photos,
  onPhotosChange,
  onPhotoClick,
  onPhotoDelete,
  disabled = false,
  maxPhotos = 10,
  className = '',
  enableCompression = true,
  showDetailedProgress = false,
  readOnly = false,
  forceArabic = false,
}) => {
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadMessages, setUploadMessages] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const tr = useCallback((key: string, arabic: string, params?: Record<string, any>) => (
    forceArabic ? arabic : t(key, params)
  ), [forceArabic, t]);

  const {
    uploadSinglePhoto,
    validateFiles,
    uploadStates,
    getOverallProgress
  } = usePhotoUpload();

  // Detect mobile device and screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear messages after a delay
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setUploadErrors([]);
      setUploadMessages([]);
    }, 5000);
  }, []);

  // Handle file upload with enhanced validation and progress tracking
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled) return;

    // Clear previous messages
    setUploadErrors([]);
    setUploadMessages([]);

    // Validate files
    const { valid: validFiles, invalid: invalidFiles } = validateFiles(files);

    // Show validation errors
    if (invalidFiles.length > 0) {
      const errors = invalidFiles.map(({ file, error }) => `${file.name}: ${error}`);
      setUploadErrors(errors);
      clearMessages();
    }

    if (validFiles.length === 0) return;

    // Check if adding these files would exceed max photos
    if (photos.length + validFiles.length > maxPhotos) {
      const error = tr('inspections.photos.cannotUploadFiles', `لا يمكن رفع ${validFiles.length} صورة. الحد الأقصى ${maxPhotos} صور لكل حقل، ولديك حاليا ${photos.length}.`, {
        count: validFiles.length,
        maxPhotos,
        currentCount: photos.length
      });
      setUploadErrors([error]);
      clearMessages();
      return;
    }

    if (!inspectionId) {
      const localPhotos = validFiles.map((file) => ({
        id: -Date.now() - Math.floor(Math.random() * 100000),
        field_id: fieldId,
        url: createImagePreview(file),
        thumbnail_url: createImagePreview(file),
        caption: file.name,
        uploaded_at: new Date().toISOString(),
        file,
        isPending: true,
      })) as Array<InspectionPhoto & { file: File; isPending: boolean }>;

      onPhotosChange([...(photos || []), ...localPhotos]);
      setUploadMessages(validFiles.map((file) => tr('inspections.photos.successfullyUploaded', `تم تجهيز ${file.name} للرفع.`, { fileName: file.name })));
      clearMessages();
      return;
    }

    // Upload files with enhanced progress tracking
    const uploadPromises = validFiles.map(async (file) => {
      try {
        const result = await uploadSinglePhoto(
          inspectionId,
          file,
          fieldId,
          undefined, // caption
          {
            enableCompression,
            onProgress: (progress, stage, details) => {
              if (showDetailedProgress) {
                console.log(`${file.name}: ${stage} (${progress}%)`, details);
              }
            },
            onSuccess: () => {
              setUploadMessages(prev => [...prev, tr('inspections.photos.successfullyUploaded', `تم رفع ${file.name} بنجاح.`, { fileName: file.name })]);
              clearMessages();
            },
            onError: (error) => {
              setUploadErrors(prev => [...prev, tr('inspections.photos.failedToUpload', `تعذر رفع ${file.name}: ${error}`, { fileName: file.name, error })]);
              clearMessages();
            },
            onValidationError: (error) => {
              setUploadErrors(prev => [...prev, tr('inspections.photos.validationError', `خطأ في ملف ${file.name}: ${error}`, { fileName: file.name, error })]);
              clearMessages();
            }
          }
        );

        return result;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        return null;
      }
    });

    const uploadResults = await Promise.allSettled(uploadPromises);
    const successfulUploads = uploadResults
      .filter((result): result is PromiseFulfilledResult<InspectionPhoto | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);

    if (successfulUploads.length > 0) {
      // Force a new array reference to ensure React re-renders
      const newPhotos = [...(photos || []), ...successfulUploads];
      onPhotosChange(newPhotos);
    }

  }, [
    inspectionId,
    fieldId,
    photos,
    onPhotosChange,
    disabled,
    maxPhotos,
    uploadSinglePhoto,
    validateFiles,
    enableCompression,
    showDetailedProgress,
    clearMessages
  ]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  }, []);

  const handleCameraClick = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [disabled, handleFileUpload]);

  // Get overall upload progress
  const overallProgress = getOverallProgress();
  const isUploading = overallProgress.activeUploads > 0;
  const canUpload = !disabled && photos.length < maxPhotos && !isUploading;

  return (
    <div className={`field-photo-upload ${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {photos.length === 0 ? (
        // Compact initial upload area
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Camera className="h-4 w-4" />
            <span>{tr('inspections.photos.addPhotos', 'إضافة صور')}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={isUploading}
              className={`
                flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                ${isMobile ? 'min-h-[40px]' : ''}
              `}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? tr('inspections.fields.uploading', 'جار الرفع') : tr('inspections.photos.browse', 'اختيار صور')}
            </button>

            {/* Camera button - only show on mobile or devices with camera */}
            {(isMobile || 'mediaDevices' in navigator) && (
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={isUploading}
                className={`
                  flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm
                  hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${isMobile ? 'min-h-[40px]' : ''}
                `}
              >
                <Camera className="h-4 w-4" />
                {tr('inspections.photos.camera', 'الكاميرا')}
              </button>
            )}
          </div>

          {/* Compact drag and drop area (desktop only) */}
          {!isMobile && canUpload && (
            <div
              className={`
                border border-dashed rounded-md p-2 text-center transition-all duration-200 text-xs text-gray-500
                ${isDragOver
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
                }
                cursor-pointer
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              {isDragOver ? tr('inspections.photos.dropPhotosHere', 'أفلت الصور هنا') : tr('inspections.photos.dragAndDrop', 'اسحب الصور وأفلتها هنا')}
            </div>
          )}
        </div>
      ) : (
        // Compact state when photos exist
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {tr('inspections.photos.photosOf', `${photos.length} من ${maxPhotos} صور`, { count: photos.length, max: maxPhotos })}
              {enableCompression && (
                <span className="ml-1 text-xs text-gray-500">({tr('inspections.photos.optimized', 'محسنة')})</span>
              )}
            </div>

            {canUpload && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  disabled={isUploading}
                  className={`
                    flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs
                    hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                    ${isMobile ? 'min-h-[32px] px-3' : ''}
                  `}
                  title="Add more photos"
                >
                  <Plus className="h-3 w-3" />
                  { tr('inspections.photos.add', 'إضافة') }
                </button>

                {(isMobile || 'mediaDevices' in navigator) && (
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    disabled={isUploading}
                    className={`
                      flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs
                      hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                      ${isMobile ? 'min-h-[32px] px-3' : ''}
                    `}
                    title="Take photo"
                  >
                    <Camera className="h-3 w-3" />
                    {isMobile ? tr('inspections.photos.camera', 'الكاميرا') : '📷'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Compact drag and drop area for additional photos (desktop only) */}
          {!isMobile && canUpload && (
            <div
              className={`
                border border-dashed rounded p-1 text-center transition-all duration-200 text-xs
                ${isDragOver
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }
                cursor-pointer
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              {isDragOver ? tr('inspections.photos.dropAdditionalPhotos', 'أفلت الصور الإضافية هنا') : tr('inspections.photos.dragMorePhotos', 'اسحب صورا إضافية هنا')}
            </div>
          )}
        </div>
      )}

      {/* Max photos reached message */}
      {photos.length >= maxPhotos && !disabled && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 text-center">
          {tr('inspections.photos.maxPhotosReached', `وصلت إلى الحد الأقصى: ${maxPhotos} صور.`, { maxPhotos })}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{tr('inspections.photos.uploadingFiles', `جار رفع ${overallProgress.activeUploads} ملف`, { 
              count: overallProgress.activeUploads,
              plural: overallProgress.activeUploads !== 1 ? 's' : ''
            })}...</span>
            <span>{Math.round(overallProgress.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Messages */}
      {uploadMessages.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadMessages.map((message, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-green-600 p-1 bg-green-50 rounded">
              <CheckCircle className="h-3 w-3 flex-shrink-0" />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {uploadErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadErrors.map((error, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-red-600 p-1 bg-red-50 rounded">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Progress (if enabled) */}
      {showDetailedProgress && Object.keys(uploadStates).length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded space-y-1 text-xs text-gray-500">
          <div className="font-medium">{tr('inspections.photos.uploadDetails', 'تفاصيل الرفع')}</div>
          {Object.entries(uploadStates).map(([fileId, state]) => (
            <div key={fileId} className="flex justify-between">
              <span>{state.stage}</span>
              <span>{state.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Photo Preview */}
      {photos.length > 0 && (
        <FieldPhotoPreview
          photos={photos}
          onPhotoClick={onPhotoClick || (() => { })}
          onPhotoDelete={onPhotoDelete || (() => { })}
          readOnly={readOnly || disabled}
          maxPreviewPhotos={4}
          forceArabic={forceArabic}
        />
      )}
    </div>
  );
};

export default FieldPhotoUpload;

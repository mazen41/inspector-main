import { useState, useCallback } from 'react';
import {
  useUploadInspectionPhotoMutation,
  useBatchUploadInspectionPhotosMutation,
  useDeleteInspectionPhotoMutation
} from '../store/api/inspectionApi';
import {
  validatePhotoEnhanced,
  getPhotoUploadErrorMessage,
  generateFileId,
  compressImageIfNeeded,
  formatUploadSpeed
} from '../utils/photoValidation';
import { formatFileSize } from '../utils/validation';
import type { InspectionPhoto } from '../types';

export interface PhotoUploadState {
  uploading: boolean;
  progress: number;
  error?: string;
  retryCount: number;
  stage: 'validating' | 'compressing' | 'uploading' | 'completed' | 'error';
  originalSize?: number;
  compressedSize?: number;
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  startTime?: number;
}

export interface PhotoUploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableCompression?: boolean;
  compressionQuality?: number;
  onProgress?: (progress: number, stage: string, details?: any) => void;
  onSuccess?: (photo: InspectionPhoto) => void;
  onError?: (error: string) => void;
  onValidationError?: (error: string) => void;
}

export interface BatchPhotoUploadOptions extends PhotoUploadOptions {
  onBatchSuccess?: (photos: InspectionPhoto[], failedUploads?: Array<{ file_name: string; error: string }>) => void;
}

export const usePhotoUpload = () => {
  const [uploadInspectionPhoto] = useUploadInspectionPhotoMutation();
  const [batchUploadInspectionPhotos] = useBatchUploadInspectionPhotosMutation();
  const [deleteInspectionPhoto] = useDeleteInspectionPhotoMutation();

  const [uploadStates, setUploadStates] = useState<Record<string, PhotoUploadState>>({});

  const updateUploadState = useCallback((fileId: string, updates: Partial<PhotoUploadState>) => {
    setUploadStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...updates }
    }));
  }, []);

  const clearUploadState = useCallback((fileId: string) => {
    setUploadStates(prev => {
      const { [fileId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const uploadSinglePhoto = useCallback(async (
    inspectionId: number,
    file: File,
    fieldId?: number,
    caption?: string,
    options: PhotoUploadOptions = {}
  ): Promise<InspectionPhoto | null> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      enableCompression = true,
      compressionQuality = 0.8,
      onProgress,
      onSuccess,
      onError,
      onValidationError
    } = options;

    const fileId = generateFileId(file);
    const startTime = Date.now();

    // Initialize upload state
    updateUploadState(fileId, {
      uploading: true,
      progress: 0,
      error: undefined,
      retryCount: 0,
      stage: 'validating',
      originalSize: file.size,
      startTime
    });

    try {
      // Step 1: Enhanced validation
      onProgress?.(5, 'Validating file...', { fileName: file.name, size: formatFileSize(file.size) });
      updateUploadState(fileId, { stage: 'validating', progress: 5 });

      const validation = validatePhotoEnhanced(file);
      if (!validation.isValid) {
        updateUploadState(fileId, {
          uploading: false,
          stage: 'error',
          error: validation.error,
          progress: 0
        });
        onValidationError?.(validation.error!);
        return null;
      }

      // Step 2: Compression (if enabled and needed)
      let processedFile = file;
      if (enableCompression) {
        onProgress?.(15, 'Optimizing image...', { originalSize: formatFileSize(file.size) });
        updateUploadState(fileId, { stage: 'compressing', progress: 15 });

        try {
          processedFile = await compressImageIfNeeded(file, undefined, compressionQuality);
          const compressionRatio = ((file.size - processedFile.size) / file.size * 100).toFixed(1);

          updateUploadState(fileId, {
            compressedSize: processedFile.size,
            progress: 25
          });

          onProgress?.(25, 'Image optimized', {
            originalSize: formatFileSize(file.size),
            compressedSize: formatFileSize(processedFile.size),
            savedSpace: compressionRatio + '%'
          });
        } catch (compressionError) {
          // If compression fails, continue with original file
          console.warn('Image compression failed, using original file:', compressionError);
          processedFile = file;
        }
      }

      // Step 3: Upload with retry logic
      let lastError: string = '';

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Update retry count and stage
          updateUploadState(fileId, {
            retryCount: attempt,
            stage: 'uploading',
            progress: 30
          });

          onProgress?.(30, attempt === 0 ? 'Starting upload...' : `Retry ${attempt}/${maxRetries}...`);

          const uploadStartTime = Date.now();

          // Simulate upload progress since RTK Query doesn't support onUploadProgress
          const progressInterval = setInterval(() => {
            setUploadStates(prev => {
              const current = prev[fileId];
              if (current && current.progress < 90) {
                const newProgress = Math.min(current.progress + 10, 90);
                onProgress?.(newProgress, 'Uploading...', {
                  fileName: processedFile.name,
                  size: formatFileSize(processedFile.size)
                });
                return {
                  ...prev,
                  [fileId]: { ...current, progress: newProgress }
                };
              }
              return prev;
            });
          }, 200);

          const result = await uploadInspectionPhoto({
            id: inspectionId,
            file: processedFile,
            fieldId,
            caption
          }).unwrap();

          clearInterval(progressInterval);

          // Success
          onProgress?.(100, 'Upload completed!', {
            fileName: file.name,
            finalSize: formatFileSize(processedFile.size),
            uploadTime: `${((Date.now() - uploadStartTime) / 1000).toFixed(1)}s`
          });

          updateUploadState(fileId, {
            progress: 100,
            uploading: false,
            stage: 'completed'
          });

          // Extract the first uploaded photo from the response
          const uploadedPhoto = result.uploaded_photos?.[0];

          onSuccess?.(uploadedPhoto);

          // Clean up after a delay
          setTimeout(() => clearUploadState(fileId), 2000);

          return uploadedPhoto;

        } catch (error: any) {
          lastError = getPhotoUploadErrorMessage(error.message || error.data?.message || 'Upload failed');

          if (attempt < maxRetries) {
            // Wait before retry with exponential backoff
            const delay = retryDelay * Math.pow(2, attempt);
            onProgress?.(30, `Upload failed, retrying in ${delay / 1000}s...`, { error: lastError });

            updateUploadState(fileId, {
              error: `Retry ${attempt + 1}/${maxRetries}: ${lastError}`,
              progress: 30
            });

            await sleep(delay);
          } else {
            // Final failure
            updateUploadState(fileId, {
              uploading: false,
              stage: 'error',
              error: lastError,
              progress: 0
            });

            onError?.(lastError);
          }
        }
      }

    } catch (error: any) {
      const errorMessage = getPhotoUploadErrorMessage(error.message || 'Unexpected error occurred');
      updateUploadState(fileId, {
        uploading: false,
        stage: 'error',
        error: errorMessage,
        progress: 0
      });
      onError?.(errorMessage);
    }

    return null;
  }, [uploadInspectionPhoto, updateUploadState, clearUploadState]);

  const uploadMultiplePhotos = useCallback(async (
    inspectionId: number,
    files: File[],
    fieldId?: number,
    captions?: string[],
    options: BatchPhotoUploadOptions = {}
  ): Promise<{ photos: InspectionPhoto[]; failedUploads?: Array<{ file_name: string; error: string }> }> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onProgress,
      onBatchSuccess,
      onError
    } = options;

    const batchId = `batch-${Date.now()}`;

    // Initialize batch upload state
    updateUploadState(batchId, {
      uploading: true,
      progress: 0,
      error: undefined,
      retryCount: 0
    });

    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Update retry count
        updateUploadState(batchId, { retryCount: attempt });

        // Simulate progress for user feedback
        onProgress?.(10, 'Starting batch upload...');
        updateUploadState(batchId, { progress: 10 });

        const result = await batchUploadInspectionPhotos({
          id: inspectionId,
          files,
          fieldId,
          captions
        }).unwrap();

        // Success
        onProgress?.(100, 'Batch upload completed!');
        updateUploadState(batchId, { progress: 100, uploading: false });

        onBatchSuccess?.(result.uploaded_photos, result.failed_uploads);
        clearUploadState(batchId);

        return { photos: result.uploaded_photos, failedUploads: result.failed_uploads };

      } catch (error: any) {
        lastError = getPhotoUploadErrorMessage(error.message || error.data?.message || 'Batch upload failed');

        if (attempt < maxRetries) {
          // Wait before retry
          await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          updateUploadState(batchId, {
            error: `Retry ${attempt + 1}/${maxRetries}: ${lastError}`,
            progress: 0
          });
        } else {
          // Final failure
          updateUploadState(batchId, {
            uploading: false,
            error: lastError,
            progress: 0
          });

          onError?.(lastError);
        }
      }
    }

    return { photos: [], failedUploads: files.map(f => ({ file_name: f.name, error: lastError })) };
  }, [batchUploadInspectionPhotos, updateUploadState, clearUploadState]);

  const deletePhoto = useCallback(async (
    inspectionId: number,
    photoId: number,
    options: { maxRetries?: number; retryDelay?: number; onSuccess?: () => void; onError?: (error: string) => void } = {}
  ): Promise<boolean> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onSuccess,
      onError
    } = options;

    const deleteId = `delete-${photoId}-${Date.now()}`;

    // Initialize delete state
    updateUploadState(deleteId, {
      uploading: true,
      progress: 0,
      error: undefined,
      retryCount: 0
    });

    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Update retry count
        updateUploadState(deleteId, { retryCount: attempt });

        await deleteInspectionPhoto({
          inspectionId,
          photoId
        }).unwrap();

        // Success
        updateUploadState(deleteId, { progress: 100, uploading: false });
        onSuccess?.();
        clearUploadState(deleteId);

        return true;

      } catch (error: any) {
        lastError = getPhotoUploadErrorMessage(error.message || error.data?.message || 'Delete failed');

        if (attempt < maxRetries) {
          // Wait before retry
          await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          updateUploadState(deleteId, {
            error: `Retry ${attempt + 1}/${maxRetries}: ${lastError}`,
            progress: 0
          });
        } else {
          // Final failure
          updateUploadState(deleteId, {
            uploading: false,
            error: lastError,
            progress: 0
          });

          onError?.(lastError);
        }
      }
    }

    return false;
  }, [deleteInspectionPhoto, updateUploadState, clearUploadState]);

  // Utility function to validate files before upload with enhanced validation
  const validateFiles = useCallback((files: File[]): { valid: File[]; invalid: Array<{ file: File; error: string }> } => {
    const valid: File[] = [];
    const invalid: Array<{ file: File; error: string }> = [];

    files.forEach(file => {
      const validation = validatePhotoEnhanced(file);
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({
          file,
          error: validation.error!
        });
      }
    });

    return { valid, invalid };
  }, []);

  // Get upload statistics
  const getUploadStats = useCallback((fileId: string) => {
    const state = uploadStates[fileId];
    if (!state) return null;

    return {
      isUploading: state.uploading,
      progress: state.progress,
      stage: state.stage,
      error: state.error,
      retryCount: state.retryCount,
      originalSize: state.originalSize ? formatFileSize(state.originalSize) : undefined,
      compressedSize: state.compressedSize ? formatFileSize(state.compressedSize) : undefined,
      compressionSavings: state.originalSize && state.compressedSize
        ? `${(((state.originalSize - state.compressedSize) / state.originalSize) * 100).toFixed(1)}%`
        : undefined,
      uploadSpeed: state.uploadSpeed ? formatUploadSpeed(state.uploadSpeed) : undefined,
      estimatedTimeRemaining: state.estimatedTimeRemaining ? `${Math.ceil(state.estimatedTimeRemaining)}s` : undefined,
      elapsedTime: state.startTime ? `${((Date.now() - state.startTime) / 1000).toFixed(1)}s` : undefined
    };
  }, [uploadStates]);

  // Get overall upload progress for multiple files
  const getOverallProgress = useCallback(() => {
    const states = Object.values(uploadStates);
    if (states.length === 0) return { progress: 0, activeUploads: 0, completedUploads: 0, failedUploads: 0 };

    const activeUploads = states.filter(s => s.uploading).length;
    const completedUploads = states.filter(s => s.stage === 'completed').length;
    const failedUploads = states.filter(s => s.stage === 'error').length;
    const totalProgress = states.reduce((sum, state) => sum + state.progress, 0);
    const averageProgress = states.length > 0 ? totalProgress / states.length : 0;

    return {
      progress: averageProgress,
      activeUploads,
      completedUploads,
      failedUploads,
      totalFiles: states.length
    };
  }, [uploadStates]);

  return {
    uploadSinglePhoto,
    uploadMultiplePhotos,
    deletePhoto,
    validateFiles,
    uploadStates,
    clearUploadState,
    getUploadStats,
    getOverallProgress
  };
};
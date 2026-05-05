import { apiClient } from './apiClient';
import { validateFileSize, validateFileType } from '../utils/validation';
import { FILE_UPLOAD } from '../utils/constants';

export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
  allowedTypes?: readonly string[];
  maxRetries?: number;
  retryDelay?: number;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface BatchFileUploadResult {
  success: boolean;
  results: FileUploadResult[];
  failedUploads?: Array<{ fileName: string; error: string }>;
}

export class FileUploadService {
  static async uploadInspectionPhoto(
    inspectionId: number,
    file: File,
    fieldId?: number,
    caption?: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const {
      onProgress,
      maxSizeMB = FILE_UPLOAD.MAX_SIZE_MB,
      allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      maxRetries = 3,
      retryDelay = 1000,
    } = options;

    // Validate file
    const validation = this.validateFile(file, maxSizeMB, allowedTypes);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const additionalData: Record<string, any> = {};
        if (fieldId) additionalData.field_id = fieldId.toString();
        if (caption) additionalData.caption = caption;

        const response = await apiClient.uploadFile(
          `/inspections/${inspectionId}/upload-photos`,
          file,
          additionalData,
          (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          }
        );

        return {
          success: true,
          url: response.data.url,
        };
      } catch (error: any) {
        lastError = error.response?.data?.error?.message || error.message || 'Upload failed';
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }

  static async batchUploadInspectionPhotos(
    inspectionId: number,
    files: File[],
    fieldId?: number,
    captions?: string[],
    options: FileUploadOptions = {}
  ): Promise<BatchFileUploadResult> {
    const {
      onProgress,
      maxSizeMB = FILE_UPLOAD.MAX_SIZE_MB,
      allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      maxRetries = 3,
      retryDelay = 1000,
    } = options;

    // Validate all files first
    const validationResults = files.map(file => ({
      file,
      validation: this.validateFile(file, maxSizeMB, allowedTypes)
    }));

    const invalidFiles = validationResults.filter(r => !r.validation.isValid);
    if (invalidFiles.length > 0) {
      return {
        success: false,
        results: [],
        failedUploads: invalidFiles.map(r => ({
          fileName: r.file.name,
          error: r.validation.error!
        }))
      };
    }

    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const formData = new FormData();
        
        files.forEach((file, index) => {
          formData.append('photos[]', file);
          if (captions && captions[index]) {
            formData.append(`captions[${index}]`, captions[index]);
          }
        });

        if (fieldId) {
          formData.append('field_id', fieldId.toString());
        }

        const response = await apiClient.post(
          `/inspections/${inspectionId}/upload-photos/batch`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
              }
            }
          }
        );

        return {
          success: true,
          results: response.data.photos?.map((photo: any) => ({
            success: true,
            url: photo.url
          })) || [],
          failedUploads: response.data.failed_uploads
        };
      } catch (error: any) {
        lastError = error.response?.data?.error?.message || error.message || 'Batch upload failed';
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      results: [],
      failedUploads: files.map(file => ({
        fileName: file.name,
        error: lastError
      }))
    };
  }

  static async deleteInspectionPhoto(
    inspectionId: number,
    photoId: number,
    options: { maxRetries?: number; retryDelay?: number } = {}
  ): Promise<{ success: boolean; error?: string }> {
    const { maxRetries = 3, retryDelay = 1000 } = options;

    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await apiClient.delete(`/inspections/${inspectionId}/photos/${photoId}`);
        return { success: true };
      } catch (error: any) {
        lastError = error.response?.data?.error?.message || error.message || 'Delete failed';
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      error: lastError
    };
  }

  static async uploadAvatar(
    file: File,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const {
      onProgress,
      maxSizeMB = FILE_UPLOAD.MAX_SIZE_MB,
      allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
    } = options;

    // Validate file
    const validation = this.validateFile(file, maxSizeMB, allowedTypes);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    try {
      const response = await apiClient.uploadFile(
        '/profile/avatar',
        file,
        {},
        (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      );

      return {
        success: true,
        url: response.data.avatar_url,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Upload failed',
      };
    }
  }

  private static validateFile(
    file: File,
    maxSizeMB: number,
    allowedTypes: readonly string[]
  ): { isValid: boolean; error?: string } {
    if (!validateFileSize(file, maxSizeMB)) {
      return {
        isValid: false,
        error: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    if (!validateFileType(file, allowedTypes)) {
      return {
        isValid: false,
        error: 'File type not supported',
      };
    }

    return { isValid: true };
  }
}
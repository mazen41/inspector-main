import { FILE_UPLOAD } from './constants';

export interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
}

export interface BatchPhotoValidationResult {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
}

/**
 * Validates a single photo file
 */
export const validatePhoto = (file: File): PhotoValidationResult => {
  const maxSize = FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024; // Convert to bytes
  const allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${FILE_UPLOAD.MAX_SIZE_MB}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check if file is actually an image by checking the file signature (optional additional validation)
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image'
    };
  }

  return { isValid: true };
};

/**
 * Validates multiple photo files
 */
export const validatePhotos = (files: File[]): BatchPhotoValidationResult => {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  files.forEach(file => {
    const validation = validatePhoto(file);
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
};

/**
 * Validates photo count against field limits
 */
export const validatePhotoCount = (
  currentPhotoCount: number, 
  newPhotoCount: number, 
  maxPhotos: number = FILE_UPLOAD.MAX_PHOTOS_PER_FIELD
): PhotoValidationResult => {
  const totalPhotos = currentPhotoCount + newPhotoCount;
  
  if (totalPhotos > maxPhotos) {
    return {
      isValid: false,
      error: `Cannot upload ${newPhotoCount} photos. Maximum ${maxPhotos} photos allowed per field (currently have ${currentPhotoCount})`
    };
  }

  return { isValid: true };
};

/**
 * Gets user-friendly error message for common upload errors
 */
export const getPhotoUploadErrorMessage = (error: string): string => {
  // Network errors
  if (error.includes('Network Error') || error.includes('ERR_NETWORK')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // Server errors
  if (error.includes('500') || error.includes('Internal Server Error')) {
    return 'Server error occurred. Please try again later.';
  }

  // File size errors
  if (error.includes('size') && error.includes('exceeds')) {
    return error; // Already user-friendly
  }

  // File type errors
  if (error.includes('type') && error.includes('not supported')) {
    return error; // Already user-friendly
  }

  // Timeout errors
  if (error.includes('timeout') || error.includes('TIMEOUT')) {
    return 'Upload timed out. Please try again with a smaller file or better connection.';
  }

  // Generic fallback
  return error || 'Upload failed. Please try again.';
};

/**
 * Generates a unique file identifier for tracking upload state
 */
export const generateFileId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified || Date.now()}`;
};

/**
 * Compresses image file if it's too large
 */
export const compressImageIfNeeded = async (
  file: File,
  maxSizeMB: number = FILE_UPLOAD.MAX_SIZE_MB,
  quality: number = 0.8
): Promise<File> => {
  // If file is already small enough, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions to reduce file size
        const maxDimension = 1920; // Max width or height
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Creates a preview URL for an image file
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Cleans up a preview URL created with createImagePreview
 */
export const cleanupImagePreview = (previewUrl: string): void => {
  URL.revokeObjectURL(previewUrl);
};

/**
 * Enhanced file validation with detailed error messages
 */
export const validatePhotoEnhanced = (file: File): PhotoValidationResult => {
  const maxSize = FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024;
  const allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;

  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      isValid: false,
      error: 'File must have a valid name'
    };
  }

  // Check file size (more detailed)
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty'
    };
  }

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      isValid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of ${FILE_UPLOAD.MAX_SIZE_MB}MB. Please compress the image or choose a smaller file.`
    };
  }

  // Check file type (more detailed)
  if (!file.type) {
    return {
      isValid: false,
      error: 'Unable to determine file type. Please ensure the file is a valid image.'
    };
  }

  if (!allowedTypes.includes(file.type as any)) {
    const allowedExtensions = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ');
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Please use one of: ${allowedExtensions}`
    };
  }

  // Additional validation for image files
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image'
    };
  }

  return { isValid: true };
};

/**
 * Progress tracking interface for file operations
 */
export interface FileOperationProgress {
  fileId: string;
  fileName: string;
  stage: 'validating' | 'compressing' | 'uploading' | 'completed' | 'error';
  progress: number; // 0-100
  error?: string;
  startTime: number;
  endTime?: number;
}

/**
 * Creates a progress tracker for file operations
 */
export class FileProgressTracker {
  private progressMap = new Map<string, FileOperationProgress>();
  private listeners = new Set<(progress: FileOperationProgress[]) => void>();

  addFile(file: File): string {
    const fileId = generateFileId(file);
    const progress: FileOperationProgress = {
      fileId,
      fileName: file.name,
      stage: 'validating',
      progress: 0,
      startTime: Date.now()
    };
    
    this.progressMap.set(fileId, progress);
    this.notifyListeners();
    return fileId;
  }

  updateProgress(fileId: string, updates: Partial<FileOperationProgress>): void {
    const current = this.progressMap.get(fileId);
    if (current) {
      const updated = { ...current, ...updates };
      if (updates.stage === 'completed' || updates.stage === 'error') {
        updated.endTime = Date.now();
      }
      this.progressMap.set(fileId, updated);
      this.notifyListeners();
    }
  }

  removeFile(fileId: string): void {
    this.progressMap.delete(fileId);
    this.notifyListeners();
  }

  getProgress(fileId: string): FileOperationProgress | undefined {
    return this.progressMap.get(fileId);
  }

  getAllProgress(): FileOperationProgress[] {
    return Array.from(this.progressMap.values());
  }

  subscribe(listener: (progress: FileOperationProgress[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const progress = this.getAllProgress();
    this.listeners.forEach(listener => listener(progress));
  }

  clear(): void {
    this.progressMap.clear();
    this.notifyListeners();
  }
}

/**
 * Estimates upload time based on file size and connection speed
 */
export const estimateUploadTime = (fileSizeBytes: number, connectionSpeedMbps: number = 10): number => {
  const fileSizeMb = fileSizeBytes / (1024 * 1024);
  const uploadTimeSeconds = (fileSizeMb * 8) / connectionSpeedMbps; // Convert to bits and calculate
  return Math.ceil(uploadTimeSeconds);
};

// formatFileSize is imported from validation.ts to avoid duplication

/**
 * Formats upload speed for display
 */
export const formatUploadSpeed = (bytesPerSecond: number): string => {
  const mbps = (bytesPerSecond * 8) / (1024 * 1024);
  return `${mbps.toFixed(1)} Mbps`;
};

/**
 * Calculates upload speed based on progress
 */
export const calculateUploadSpeed = (
  bytesUploaded: number,
  startTime: number,
  currentTime: number = Date.now()
): number => {
  const timeElapsed = (currentTime - startTime) / 1000; // Convert to seconds
  return timeElapsed > 0 ? bytesUploaded / timeElapsed : 0;
};
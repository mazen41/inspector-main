import type { FieldValue, InspectionPhoto, InspectionFormState } from './inspection';

/**
 * Manual save status interface for tracking the state of user-initiated form saving
 */
export interface ManualSaveStatus {
    status: 'idle' | 'saving' | 'saved' | 'error';
    lastSaved?: Date;
    error?: string;
    hasUnsavedChanges: boolean;
}

/**
 * Data structure for manual save updates
 */
export interface ManualSaveUpdate {
    field_id: number;
    value: FieldValue;
    notes?: string;
    photos?: InspectionPhoto[];
}

/**
 * Submission status interface for tracking form submission state
 */
export interface SubmissionStatus {
    status: 'idle' | 'validating' | 'submitting' | 'success' | 'error';
    error?: string;
}

/**
 * Data structure for inspection completion
 */
export interface InspectionCompletionData {
    total_score: number;
    inspector_notes: string;
    overall_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    recommendations: string;
}

/**
 * Main hook return interface that combines all form-related functionality
 * This interface defines the complete API returned by the useInspectionForm hook
 */
export interface InspectionFormHookReturn {
    // Form state
    formState: InspectionFormState;
    fieldNotes: Record<number, string>;
    fieldPhotos: Record<number, InspectionPhoto[]>;
    hasUnsavedChanges: boolean;

    // Status states
    saveStatus: ManualSaveStatus;
    submissionStatus: SubmissionStatus;
    formErrors: string[];
    photoErrors: Record<number, string>;

    // Handlers
    handleFieldChange: (fieldId: number, value: FieldValue) => void;
    handleNotesChange: (fieldId: number, notes: string) => void;
    handlePhotosChange: (fieldId: number, photos: InspectionPhoto[]) => void;
    handleFieldBlur: (fieldId: number) => void;
    handleSubmit: () => Promise<void>;
    handleCompletionSubmit: (data: InspectionCompletionData) => Promise<void>;

    // Submission state
    isReadyForCompletion: boolean;
    clearReadyForCompletion: () => void;

    // Manual save
    handleManualSave: () => Promise<void>;

    // Photo management
    handlePhotoClick: (photo: InspectionPhoto) => void;
    handlePhotoDelete: (photoId: number) => Promise<void>;
    allPhotosForPreview: (InspectionPhoto & { fieldName?: string })[];
    
    // Photo modal state
    showPhotoModal: boolean;
    selectedPhotoIndex: number;
    closePhotoModal: () => void;
}
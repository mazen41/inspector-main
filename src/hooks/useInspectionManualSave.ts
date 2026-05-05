import { useState, useCallback } from 'react';
import { useUpdateFieldValuesMutation } from '../store/api/inspectionApi';
import type { ManualSaveStatus, ManualSaveUpdate } from '../types/form';

/**
 * Configuration options for manual save functionality
 */
export interface ManualSaveConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay for exponential backoff in milliseconds */
  baseRetryDelay?: number;
  /** Maximum retry delay in milliseconds */
  maxRetryDelay?: number;
  /** Callback called after successful manual save */
  onSaveSuccess?: () => void;
  /** Callback called when save fails */
  onSaveError?: (error: string) => void;
}

/**
 * Return type for the useInspectionManualSave hook
 */
export interface InspectionManualSaveReturn {
  /** Current manual save status */
  saveStatus: ManualSaveStatus;
  /** Execute manual save with field updates */
  handleManualSave: (updates: ManualSaveUpdate[]) => Promise<void>;
  /** Clear save status */
  clearSaveStatus: () => void;
  /** Check if save is currently active */
  isSaving: boolean;
}

/**
 * Default configuration for manual save
 */
const defaultConfig: Required<Omit<ManualSaveConfig, 'onSaveSuccess' | 'onSaveError'>> = {
  maxRetries: 3,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 10000, // 10 seconds
};

/**
 * Custom hook for managing inspection form manual save functionality
 * 
 * Features:
 * - User-controlled save operations
 * - Retry logic with exponential backoff for failed saves
 * - Status tracking and error handling
 * - Success confirmation with timestamps
 * - Integration with form state management
 */
export const useInspectionManualSave = (
  inspectionId: number | undefined,
  config: ManualSaveConfig = {}
): InspectionManualSaveReturn => {
  const mergedConfig = { ...defaultConfig, ...config };

  // Manual save status state
  const [saveStatus, setSaveStatus] = useState<ManualSaveStatus>({
    status: 'idle',
    hasUnsavedChanges: false,
  });

  // RTK Query mutation for batch updates
  const [updateFieldValues, { isLoading: isMutationLoading }] = useUpdateFieldValuesMutation();

  /**
   * Calculate retry delay using exponential backoff
   */
  const calculateRetryDelay = useCallback((retryCount: number): number => {
    const delay = mergedConfig.baseRetryDelay * Math.pow(2, retryCount);
    return Math.min(delay, mergedConfig.maxRetryDelay);
  }, [mergedConfig.baseRetryDelay, mergedConfig.maxRetryDelay]);

  /**
   * Perform the actual manual save operation with retry logic
   */
  const performSaveWithRetry = useCallback(async (
    fieldValues: ManualSaveUpdate[],
    retryCount = 0
  ): Promise<void> => {
    if (!inspectionId || fieldValues.length === 0) {
      return;
    }

    try {
      setSaveStatus(prev => ({
        ...prev,
        status: 'saving',
        error: undefined,
      }));

      await updateFieldValues({
        id: inspectionId,
        fieldValues,
      }).unwrap();

      // Success - update status with timestamp
      const now = new Date();
      setSaveStatus({
        status: 'saved',
        lastSaved: now,
        hasUnsavedChanges: false,
      });

      // Call success callback to mark form as clean
      if (mergedConfig.onSaveSuccess) {
        mergedConfig.onSaveSuccess();
      }

      // Clear saved status after a delay to return to idle
      setTimeout(() => {
        setSaveStatus(prev => 
          prev.status === 'saved' ? { ...prev, status: 'idle' } : prev
        );
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      
      // Check if we should retry
      if (retryCount < mergedConfig.maxRetries) {
        const nextRetryCount = retryCount + 1;
        const retryDelay = calculateRetryDelay(retryCount);

        setSaveStatus(prev => ({
          ...prev,
          status: 'error',
          error: `${errorMessage} (retrying in ${Math.ceil(retryDelay / 1000)}s...)`,
        }));

        // Schedule retry
        setTimeout(() => {
          performSaveWithRetry(fieldValues, nextRetryCount);
        }, retryDelay);

      } else {
        // Max retries reached
        const finalError = `${errorMessage} (max retries reached)`;
        setSaveStatus(prev => ({
          ...prev,
          status: 'error',
          error: finalError,
        }));

        // Call error callback
        if (mergedConfig.onSaveError) {
          mergedConfig.onSaveError(finalError);
        }
      }
    }
  }, [inspectionId, updateFieldValues, calculateRetryDelay, mergedConfig]);

  /**
   * Execute manual save operation
   */
  const handleManualSave = useCallback(async (updates: ManualSaveUpdate[]): Promise<void> => {
    if (!inspectionId || updates.length === 0) {
      return;
    }

    await performSaveWithRetry(updates, 0);
  }, [inspectionId, performSaveWithRetry]);

  /**
   * Clear save status
   */
  const clearSaveStatus = useCallback(() => {
    setSaveStatus(prev => ({
      ...prev,
      status: 'idle',
      error: undefined,
    }));
  }, []);

  /**
   * Check if save is currently active
   */
  const isSaving = saveStatus.status === 'saving' || isMutationLoading;

  return {
    saveStatus,
    handleManualSave,
    clearSaveStatus,
    isSaving,
  };
};
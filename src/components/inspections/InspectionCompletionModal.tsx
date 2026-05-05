import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '../common';
import { useTranslation } from '../../hooks/useTranslation';


export interface InspectionCompletionData {
    total_score: number;
    inspector_notes: string;
    overall_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    recommendations: string;
}

interface InspectionCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InspectionCompletionData) => Promise<void>;
    isSubmitting?: boolean;
    inspectionNumber?: string;
}

const InspectionCompletionModal: React.FC<InspectionCompletionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting = false,
    inspectionNumber,
}) => {
    const { t, isRTL } = useTranslation();

    const [formData, setFormData] = useState<InspectionCompletionData>({
        total_score: 0,
        inspector_notes: '',
        overall_condition: 'good',
        recommendations: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof InspectionCompletionData, string>>>({});
    const [submitError, setSubmitError] = useState<string>('');

    const totalScoreRef = useRef<HTMLInputElement | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                total_score: 0,
                inspector_notes: '',
                overall_condition: 'good',
                recommendations: '',
            });
            setErrors({});
            setSubmitError('');
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof InspectionCompletionData, string>> = {};

        // Validate total_score
        if (formData.total_score < 0 || formData.total_score > 100) {
            newErrors.total_score = t('inspections.completion.validation.scoreRange');
        }

        // Validate inspector_notes
        if (!formData.inspector_notes.trim()) {
            newErrors.inspector_notes = t('inspections.completion.validation.notesRequired');
        } else if (formData.inspector_notes.trim().length < 10) {
            newErrors.inspector_notes = t('inspections.completion.validation.notesMinLength');
        }

        // Validate overall_condition (should always be valid due to select)
        const validConditions = ['excellent', 'good', 'fair', 'poor', 'critical'];
        if (!validConditions.includes(formData.overall_condition)) {
            newErrors.overall_condition = t('inspections.completion.validation.conditionRequired');
        }

        // Validate recommendations
        if (!formData.recommendations.trim()) {
            newErrors.recommendations = t('inspections.completion.validation.recommendationsRequired');
        } else if (formData.recommendations.trim().length < 10) {
            newErrors.recommendations = t('inspections.completion.validation.recommendationsMinLength');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
            // Modal will be closed by parent component on success
        } catch (error: unknown) {
            console.error('Failed to complete inspection:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : (error as { data?: { message?: string } })?.data?.message ||
                t('inspections.completion.errors.submitFailed');
            setSubmitError(errorMessage);
        }
    };

    const handleInputChange = (field: keyof InspectionCompletionData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }

        // Clear submit error when user makes changes
        if (submitError) {
            setSubmitError('');
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'excellent':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'good':
                return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'fair':
                return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            case 'poor':
                return 'text-orange-700 bg-orange-50 border-orange-200';
            case 'critical':
                return 'text-red-700 bg-red-50 border-red-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={inspectionNumber ? t('inspections.completion.titleWithNumber', { inspectionNumber }) : t('inspections.completion.title')}
            size="lg"
            closeOnOverlayClick={!isSubmitting}
            closeOnEscape={!isSubmitting}
            initialFocus={totalScoreRef as React.RefObject<HTMLElement>}
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-6"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* Submit Error */}
                {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className={clsx(
                            'flex items-center gap-2',
                            isRTL ? 'flex-row-reverse' : 'flex-row'
                        )}>
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <p className="text-red-800 font-medium">{t('common.status.error')}</p>
                        </div>
                        <p className={clsx(
                            'text-red-700 text-sm mt-1',
                            isRTL ? 'text-right' : 'text-left'
                        )}>{submitError}</p>
                    </div>
                )}

                {/* Total Score */}
                <div>
                    <label
                        htmlFor="total_score"
                        className={clsx(
                            'block text-sm font-medium text-gray-700 mb-2',
                            isRTL ? 'text-right' : 'text-left'
                        )}
                    >
                        {t('inspections.completion.fields.totalScore')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            ref={totalScoreRef}
                            type="number"
                            id="total_score"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.total_score}
                            onChange={(e) => handleInputChange('total_score', parseInt(e.target.value) || 0)}
                            className={clsx(
                                'w-full py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                                errors.total_score ? 'border-red-300 bg-red-50' : 'border-gray-300',
                                isRTL ? 'text-right pl-16 pr-3 rtl:text-right' : 'text-left pr-3 pl-16 ltr:text-left'
                            )}
                            placeholder={t('inspections.completion.placeholders.totalScore')}
                            disabled={isSubmitting}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                        <div className={clsx(
                            'absolute inset-y-0 flex items-center px-3 pointer-events-none',
                            isRTL ? 'left-0' : 'right-0'
                        )}>
                            <span className="text-gray-500 text-sm">/ 100</span>
                        </div>
                    </div>
                    {errors.total_score && (
                        <p className={clsx(
                            'text-red-600 text-sm mt-1',
                            isRTL ? 'text-right' : 'text-left'
                        )}>{errors.total_score}</p>
                    )}
                    <p className={clsx(
                        'text-gray-500 text-sm mt-1',
                        isRTL ? 'text-right' : 'text-left'
                    )}>
                        {t('inspections.completion.help.totalScore')}
                    </p>
                </div>

                {/* Overall Condition */}
                <div>
                    <label
                        htmlFor="overall_condition"
                        className={clsx(
                            'block text-sm font-medium text-gray-700 mb-2',
                            isRTL ? 'text-right' : 'text-left'
                        )}
                    >
                        {t('inspections.completion.fields.overallCondition')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="overall_condition"
                        value={formData.overall_condition}
                        onChange={(e) => handleInputChange('overall_condition', e.target.value)}
                        className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            errors.overall_condition ? 'border-red-300 bg-red-50' : 'border-gray-300',
                            getConditionColor(formData.overall_condition),
                            isRTL ? 'text-right' : 'text-left'
                        )}
                        disabled={isSubmitting}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        <option value="excellent">{t('inspections.completion.conditions.excellent')}</option>
                        <option value="good">{t('inspections.completion.conditions.good')}</option>
                        <option value="fair">{t('inspections.completion.conditions.fair')}</option>
                        <option value="poor">{t('inspections.completion.conditions.poor')}</option>
                        <option value="critical">{t('inspections.completion.conditions.critical')}</option>
                    </select>
                    {errors.overall_condition && (
                        <p className={clsx(
                            'text-red-600 text-sm mt-1',
                            isRTL ? 'text-right' : 'text-left'
                        )}>{errors.overall_condition}</p>
                    )}
                    <p className={clsx(
                        'text-gray-500 text-sm mt-1',
                        isRTL ? 'text-right' : 'text-left'
                    )}>
                        {t('inspections.completion.help.overallCondition')}
                    </p>
                </div>

                {/* Inspector Notes */}
                <div>
                    <label
                        htmlFor="inspector_notes"
                        className={clsx(
                            'block text-sm font-medium text-gray-700 mb-2',
                            isRTL ? 'text-right' : 'text-left'
                        )}
                    >
                        {t('inspections.completion.fields.inspectorNotes')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="inspector_notes"
                        rows={4}
                        value={formData.inspector_notes}
                        onChange={(e) => handleInputChange('inspector_notes', e.target.value)}
                        className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
                            errors.inspector_notes ? 'border-red-300 bg-red-50' : 'border-gray-300',
                            isRTL ? 'text-right' : 'text-left'
                        )}
                        placeholder={t('inspections.completion.placeholders.inspectorNotes')}
                        disabled={isSubmitting}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {errors.inspector_notes && (
                        <p className={clsx(
                            'text-red-600 text-sm mt-1',
                            isRTL ? 'text-right' : 'text-left'
                        )}>{errors.inspector_notes}</p>
                    )}
                    <p className={clsx(
                        'text-gray-500 text-sm mt-1',
                        isRTL ? 'text-right' : 'text-left'
                    )}>
                        {t('inspections.completion.help.inspectorNotes')}
                    </p>
                </div>

                {/* Recommendations */}
                <div>
                    <label
                        htmlFor="recommendations"
                        className={clsx(
                            'block text-sm font-medium text-gray-700 mb-2',
                            isRTL ? 'text-right' : 'text-left'
                        )}
                    >
                        {t('inspections.completion.fields.recommendations')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="recommendations"
                        rows={4}
                        value={formData.recommendations}
                        onChange={(e) => handleInputChange('recommendations', e.target.value)}
                        className={clsx(
                            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
                            errors.recommendations ? 'border-red-300 bg-red-50' : 'border-gray-300',
                            isRTL ? 'text-right' : 'text-left'
                        )}
                        placeholder={t('inspections.completion.placeholders.recommendations')}
                        disabled={isSubmitting}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {errors.recommendations && (
                        <p className={clsx(
                            'text-red-600 text-sm mt-1',
                            isRTL ? 'text-right' : 'text-left'
                        )}>{errors.recommendations}</p>
                    )}
                    <p className={clsx(
                        'text-gray-500 text-sm mt-1',
                        isRTL ? 'text-right' : 'text-left'
                    )}>
                        {t('inspections.completion.help.recommendations')}
                    </p>
                </div>

                {/* Form Actions */}
                <div className={clsx(
                    'flex gap-3 pt-4 border-t border-gray-200',
                    isRTL ? 'justify-start flex-row-reverse' : 'justify-end flex-row'
                )}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('common.buttons.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                            isRTL ? 'flex-row-reverse' : 'flex-row'
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Clock className="h-4 w-4 animate-spin" />
                                {t('inspections.completion.actions.completing')}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                {t('inspections.completion.actions.complete')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default InspectionCompletionModal;
import React, { useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from '../../../hooks/useTranslation';

interface NotesInputProps {
    fieldId: number;
    value?: string | null;
    onChange: (notes: string) => void;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    className?: string;
}

const NotesInput: React.FC<NotesInputProps> = ({
    fieldId,
    value,
    onChange,
    disabled = false,
    placeholder,
    maxLength = 500,
    className = '',
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { t, isRTL } = useTranslation();

    const notesValue = value || '';
    const characterCount = notesValue.length;
    const hasNotes = notesValue.trim().length > 0;

    const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        onChange(newValue);
    }, [onChange]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setIsExpanded(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        // Keep expanded if there are notes
        if (!hasNotes) {
            setIsExpanded(false);
        }
    }, [hasNotes]);

    const toggleExpanded = useCallback(() => {
        if (!disabled) {
            setIsExpanded(!isExpanded);
        }
    }, [isExpanded, disabled]);

    const defaultPlaceholder = t?.('forms.placeholders.addNotes') || 'Add notes...';

    return (
        <div className={clsx('notes-input-wrapper', className)} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toggle Button */}
            {!isExpanded && (
                <button
                    type="button"
                    onClick={toggleExpanded}
                    disabled={disabled}
                    className={clsx(
                        'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                        hasNotes
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600',
                        disabled && 'opacity-50 cursor-not-allowed',
                        isRTL && 'flex-row-reverse'
                    )}
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>
                        {hasNotes
                            ? `${t?.('forms.labels.notes') || 'Notes'} (${characterCount})`
                            : t?.('forms.labels.addNotes') || 'Add Notes'
                        }
                    </span>
                </button>
            )}

            {/* Expanded Notes Input */}
            {isExpanded && (
                <div className={clsx(
                    'notes-input-expanded border rounded-lg transition-all duration-200',
                    isFocused ? 'border-blue-300 ring-2 ring-blue-500 ring-opacity-20' : 'border-gray-200',
                    disabled && 'opacity-50'
                )}>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <div className={clsx(
                            'flex items-center gap-2 text-sm font-medium text-gray-700',
                            isRTL && 'flex-row-reverse'
                        )}>
                            <MessageSquare className="h-4 w-4" />
                            <span>{t?.('forms.labels.notes') || 'Notes'}</span>
                        </div>

                        <button
                            type="button"
                            onClick={toggleExpanded}
                            disabled={disabled}
                            className={clsx(
                                'text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600',
                                'transition-colors duration-200',
                                disabled && 'cursor-not-allowed'
                            )}
                            aria-label={t?.('forms.actions.collapse') || 'Collapse notes'}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-3">
                        <textarea
                            id={`notes-${fieldId}`}
                            value={notesValue}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            disabled={disabled}
                            maxLength={maxLength}
                            rows={3}
                            placeholder={placeholder || defaultPlaceholder}
                            className={clsx(
                                'w-full resize-none border-0 focus:ring-0 focus:outline-none',
                                'text-sm text-gray-700 placeholder-gray-400',
                                'bg-transparent',
                                isRTL && 'text-right',
                                disabled && 'cursor-not-allowed'
                            )}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />

                        {/* Character Count */}
                        {maxLength && (
                            <div className={clsx(
                                'flex justify-end mt-2 text-xs',
                                isRTL && 'justify-start'
                            )}>
                                <span className={clsx(
                                    characterCount > maxLength * 0.9
                                        ? characterCount >= maxLength
                                            ? 'text-red-500'
                                            : 'text-amber-500'
                                        : 'text-gray-400'
                                )}>
                                    {characterCount}/{maxLength}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesInput;
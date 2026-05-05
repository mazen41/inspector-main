import React from 'react';
import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useAccessibility';
import { useTranslation } from '../../hooks/useTranslation';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4',
  rounded = false 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div 
      className={`
        ${width} ${height} bg-gray-200 
        ${rounded ? 'rounded-full' : 'rounded'} 
        ${!prefersReducedMotion ? 'loading-skeleton' : ''} 
        ${className}
      `}
      aria-hidden="true"
    />
  );
};

interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  lines = 3, 
  showAvatar = false,
  className = ''
}) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`} aria-hidden="true">
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton width="w-12" height="h-12" rounded />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton width="w-3/4" height="h-5" />
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton 
              key={index}
              width={index === lines - 1 ? 'w-1/2' : 'w-full'} 
              height="h-4" 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`} aria-hidden="true">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} width="flex-1" height="h-4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width="flex-1" 
                  height="h-4" 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
  messageKey?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message, 
  messageKey = 'common.status.loading',
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { t, isRTL } = useTranslation();
  
  const displayMessage = messageKey ? t(messageKey) : message;
  
  return (
    <div 
      className={clsx(
        'flex flex-col items-center justify-center min-h-64',
        className
      )}
      role="status"
      aria-live="polite"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={clsx(
        'w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full',
        !prefersReducedMotion && 'animate-spin'
      )} />
      <p className={clsx(
        'mt-4 text-sm text-gray-600',
        isRTL && 'text-right'
      )} aria-live="polite">
        {displayMessage}
      </p>
    </div>
  );
};

interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  messageKey?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  size = 'md', 
  message,
  messageKey,
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { t, isRTL } = useTranslation();
  
  const displayMessage = messageKey ? t(messageKey) : message;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={clsx(
      'flex items-center',
      isRTL ? 'space-x-reverse space-x-2' : 'space-x-2',
      className
    )} role="status">
      <div className={clsx(
        'border-2 border-gray-200 border-t-blue-600 rounded-full',
        sizeClasses[size],
        !prefersReducedMotion && 'animate-spin'
      )} />
      {displayMessage && (
        <span className={clsx(
          'text-sm text-gray-600',
          isRTL && 'text-right'
        )} aria-live="polite">
          {displayMessage}
        </span>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  label?: string;
  labelKey?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label,
  labelKey,
  showPercentage = true,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation();
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const displayLabel = labelKey ? t(labelKey) : label;
  
  return (
    <div 
      className={className} 
      role="progressbar" 
      aria-valuenow={clampedProgress} 
      aria-valuemin={0} 
      aria-valuemax={100}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {(displayLabel || showPercentage) && (
        <div className={clsx(
          'flex justify-between items-center mb-2',
          isRTL && 'flex-row-reverse'
        )}>
          {displayLabel && (
            <span className={clsx(
              'text-sm font-medium text-gray-700',
              isRTL && 'text-right'
            )}>{displayLabel}</span>
          )}
          {showPercentage && (
            <span className={clsx(
              'text-sm text-gray-500',
              isRTL && 'text-left'
            )}>{clampedProgress}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
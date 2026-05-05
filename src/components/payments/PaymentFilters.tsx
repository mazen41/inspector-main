import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import type { PaymentFilters, PaymentStatus } from '../../types/payment';

interface PaymentFiltersProps {
  filters: PaymentFilters;
  onFilterChange: (filters: Partial<PaymentFilters>) => void;
}

const PaymentFiltersComponent: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  const statusOptions: { value: PaymentStatus | ''; label: string }[] = [
    { value: '', label: t('payments.filters.allStatuses') },
    { value: 'pending', label: t('payments.status.pending') },
    { value: 'completed', label: t('payments.status.completed') },
    { value: 'failed', label: t('payments.status.failed') },
    { value: 'cancelled', label: t('payments.status.cancelled') },
  ];

  const handleClearFilters = () => {
    onFilterChange({
      status: undefined,
      start_date: undefined,
      end_date: undefined,
      type: undefined,
    });
  };

  const hasActiveFilters = filters.status || filters.start_date || filters.end_date || filters.type;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4 items-end">

        <div className="min-w-0">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            {t('payments.filters.status')}
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={(e) => onFilterChange({
              status: e.target.value as PaymentStatus || undefined
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            {t('payments.filters.fromDate')}
          </label>
          <input
            type="date"
            id="start_date"
            value={filters.start_date || ''}
            onChange={(e) => onFilterChange({ start_date: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            {t('payments.filters.toDate')}
          </label>
          <input
            type="date"
            id="end_date"
            value={filters.end_date || ''}
            onChange={(e) => onFilterChange({ end_date: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('payments.filters.clearFilters')}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentFiltersComponent;
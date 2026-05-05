import React, { useState } from 'react';
import { useGetPaymentsQuery } from '../../store/api/paymentApi';
import { useTranslation } from '../../hooks/useTranslation';
import type { PaymentFilters } from '../../types/payment';
import PaymentCard from './PaymentCard';
import PaymentFiltersComponent from './PaymentFilters';
import { LoadingSpinner, ErrorMessage, Pagination } from '../common';

const PaymentList: React.FC = () => {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    per_page: 10,
  });
  const { t } = useTranslation();

  const { data, isLoading, error } = useGetPaymentsQuery(filters);

  const handleFilterChange = (newFilters: Partial<PaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={t('payments.list.failedToLoad')} />;
  }

  const payments = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PaymentFiltersComponent 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">{t('payments.list.noPayments')}</div>
          <p className="text-gray-500 mt-2">
            {filters.status || filters.start_date || filters.end_date || filters.type
              ? t('payments.list.tryAdjustingFilters')
              : t('payments.list.noRecordsYet')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      )}

      {meta && meta.total > meta.per_page && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={Math.ceil(meta.total / meta.per_page)}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default PaymentList;
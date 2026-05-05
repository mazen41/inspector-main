import React from 'react';
import { useGetPaymentSummaryQuery } from '../../store/api/paymentApi';
import { formatCurrency } from '../../utils/format';
import { useTranslation } from '../../hooks/useTranslation';
import { LoadingSpinner, ErrorMessage } from '../common';

const PaymentSummary: React.FC = () => {
  const { data: summaryResponse, isLoading, error } = useGetPaymentSummaryQuery();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <LoadingSpinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={t('payments.summary.failedToLoadSummary')} />;
  }

  if (!summaryResponse?.data) {
    return null;
  }

  const summary = summaryResponse.data;

  const summaryCards = [
    {
      title: t('payments.summary.pendingPayments'),
      value: formatCurrency(summary.pending_payments),
      count: t('payments.summary.awaitingPayout'),
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: t('payments.summary.totalEarnings'),
      value: formatCurrency(summary.total_earnings),
      count: t('payments.summary.allTimeEarnings'),
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: t('payments.summary.thisMonthEarnings'),
      value: formatCurrency(summary.this_month.earnings),
      count: t('payments.summary.currentMonthEarnings'),
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: t('payments.summary.currentBalance'),
      value: formatCurrency(summary.current_balance),
      count: t('payments.summary.availableBalance'),
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card, index) => (
        <div
          key={index}
          className={`bg-white p-6 rounded-lg shadow-sm border ${card.borderColor} ${card.bgColor}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              <p className="text-xs text-gray-500">
                {card.count}
              </p>
            </div>
            <div className="flex-shrink-0">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentSummary;
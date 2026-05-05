import React from 'react';
import { PaymentSummary, PaymentList } from '../components/payments';
import { useTranslation } from '@/hooks/useTranslation';
const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
      </div>

      {/* Payment Summary */}
      <PaymentSummary />

      {/* Payment List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
         {t('payments.title')}
        </h2>
        <PaymentList />
      </div>
    </div>
  );
};

export default PaymentsPage;
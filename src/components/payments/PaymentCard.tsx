import React, { useState } from 'react';
import type { Payment } from '../../types/payment';
import { useTranslation } from '../../hooks/useTranslation';
import { useLocaleFormatters } from '../../hooks/useLocaleFormatters';
import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentDetailModal from './PaymentDetailModal';

interface PaymentCardProps {
  payment: Payment;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
  const [showDetail, setShowDetail] = useState(false);
  const { t } = useTranslation();
  const { formatDate } = useLocaleFormatters();

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {payment.formatted_amount}
              </h3>
              <p className="text-sm text-gray-500">
                {payment.type_display}
              </p>
            </div>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('payments.fields.type')}:</span>
            <p className="font-medium text-gray-900">
              {payment.type_display}
            </p>
          </div>
          <div>
            <span className="text-gray-500">{t('payments.fields.status')}:</span>
            <p className="font-medium text-gray-900">
              {payment.status_display}
            </p>
          </div>
          <div>
            <span className="text-gray-500">{t('payments.fields.created')}:</span>
            <p className="font-medium text-gray-900">
              {formatDate(payment.created_at)}
            </p>
          </div>
          {payment.payment_method && (
            <div>
              <span className="text-gray-500">{t('payments.fields.method')}:</span>
              <p className="font-medium text-gray-900">
                {payment.payment_method}
              </p>
            </div>
          )}
        </div>

        {(payment.description || payment.notes) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {payment.description && (
              <>
                <span className="text-gray-500 text-sm">{t('payments.fields.description')}:</span>
                <p className="text-gray-700 text-sm mt-1">{payment.description}</p>
              </>
            )}
            {payment.notes && (
              <>
                <span className="text-gray-500 text-sm">{t('payments.fields.notes')}:</span>
                <p className="text-gray-700 text-sm mt-1">{payment.notes}</p>
              </>
            )}
          </div>
        )}
      </div>

      <PaymentDetailModal
        payment={payment}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
};

export default PaymentCard;
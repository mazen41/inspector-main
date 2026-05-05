
import type { Payment } from '../../types/payment';
// import { formatCurrency } from '../../utils/format'; // Not needed with formatted_amount from API
import { formatDate } from '../../utils/date';
import { useTranslation } from '../../hooks/useTranslation';
import PaymentStatusBadge from './PaymentStatusBadge';
import { Modal } from '../common';

interface PaymentDetailModalProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentDetailModal = ({
  payment,
  isOpen,
  onClose,
}: PaymentDetailModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payments.modal.paymentDetails')}>
      <div className="space-y-6">
        {/* Payment Overview */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {payment.formatted_amount}
            </h3>
            <p className="text-gray-500">{payment.type_display}</p>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {/* Payment Information */}
        <div className="grid grid-cols-1 gap-6 rtl:text-right">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              {t('payments.modal.paymentInformation')}
            </h4>

            <div>
              <label className="text-sm text-gray-500">{t('payments.fields.paymentId')}</label>
              <p className="font-medium text-gray-900">#{payment.id}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">{t('payments.fields.date')}</label>
              <p className="font-medium text-gray-900">
                {formatDate(payment.created_at)}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">{t('payments.fields.type')}</label>
              <p className="font-medium text-gray-900">
                {payment.type_display}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">{t('payments.fields.status')}</label>
              <p className="font-medium text-gray-900">
                {payment.status_display}
              </p>
            </div>

            {payment.payment_method && (
              <div>
                <label className="text-sm text-gray-500">{t('payments.fields.paymentMethod')}</label>
                <p className="font-medium text-gray-900 capitalize">
                  {payment.payment_method}
                </p>
              </div>
            )}

            {payment.transaction_reference && (
              <div>
                <label className="text-sm text-gray-500">{t('payments.fields.transactionReference')}</label>
                <p className="font-medium text-gray-900 font-mono text-sm">
                  {payment.transaction_reference}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div>
            <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">
              {t('payments.fields.notes')}
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{payment.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {t('payments.modal.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentDetailModal;
import type { ApiFilters } from './api';

export interface Payment {
  id: number;
  type: PaymentType;
  type_display: string;
  amount: number;
  formatted_amount: string;
  description?: string;
  payment_method?: string;
  payment_details?: any;
  status: PaymentStatus;
  status_display: string;
  transaction_reference?: string;
  notes?: string;
  processed_by?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentType = 'earning' | 'payment' | 'adjustment';

export interface PaymentSummary {
  total_earnings: number;
  total_payments_received: number;
  pending_payments: number;
  current_balance: number;
  this_month: {
    earnings: number;
    payments_received: number;
  };
  last_payment?: {
    amount: number;
    date: string;
    payment_method?: string;
  };
}

export interface PaymentFilters extends ApiFilters {
  status?: PaymentStatus;
  type?: PaymentType;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'amount' | 'status' | 'type';
  sort_order?: 'asc' | 'desc';
}
import { apiSlice } from './apiSlice';
import type { Payment, PaymentFilters, PaymentSummary } from '../../types';

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<{
      data: Payment[];
      meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
      };
      links: {
        first: string;
        last: string;
        prev?: string;
        next?: string;
      };
    }, PaymentFilters>({
      query: (filters) => ({
        url: '/payments',
        params: filters,
      }),
      providesTags: ['Payment'],
    }),
    getPayment: builder.query<{ data: Payment }, number>({
      query: (id) => `/payments/${id}`,
      providesTags: (_, __, id) => [{ type: 'Payment', id }],
    }),
    getPaymentSummary: builder.query<{ data: PaymentSummary }, void>({
      query: () => '/payments/summary',
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPaymentSummaryQuery,
} = paymentApi;
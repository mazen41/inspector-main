import { apiSlice } from './apiSlice';
import type { DashboardStats, DashboardAnalytics } from '../../types';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{ data: DashboardStats }, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    getDashboardAnalytics: builder.query<{ data: DashboardAnalytics }, { 
      period?: string;
      start_date?: string;
      end_date?: string;
    }>({
      query: (params) => ({
        url: '/dashboard/analytics',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetDashboardAnalyticsQuery,
} = dashboardApi;
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import type { ApiError } from '../../types';

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/inspector`,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;

    // Add authentication token
    const token = state.auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Add language header
    const currentLanguage = state.localization?.currentLanguage;
    if (currentLanguage) {
      headers.set('App-Language', currentLanguage.code);
    }

    headers.set('accept', 'application/json');
    headers.set('content-type', 'application/json');
    headers.set('System-Key', import.meta.env.VITE_BACKEND_SYSTEM_KEY)
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expired, logout user
    api.dispatch({ type: 'auth/logout' });
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Dashboard', 'Inspection', 'ManualExamination', 'Payment', 'Profile', 'Language'],
  endpoints: () => ({}),
});

// Helper function to transform API errors
export const transformApiError = (error: any): string => {
  if (error.data && typeof error.data === 'object') {
    const apiError = error.data as ApiError;
    if (apiError.error?.message) {
      return apiError.error.message;
    }
    if (apiError.error?.details) {
      const firstField = Object.keys(apiError.error.details)[0];
      return apiError.error.details[firstField][0];
    }
  }
  return error.message || 'An unexpected error occurred';
};

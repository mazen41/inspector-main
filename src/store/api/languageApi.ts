import { apiSlice } from './apiSlice';
import type { Language, LanguageResponse } from '../../types/localization';

export const languageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLanguages: builder.query<Language[], void>({
      query: () => ({
        url: '/languages',
        method: 'GET',
      }),
      transformResponse: (response: LanguageResponse) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch languages');
      },
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          message: response.data?.error?.message || 'Failed to fetch languages',
        };
      },
      providesTags: ['Language'],
      // Cache for 5 minutes since languages don't change frequently
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const { useGetLanguagesQuery, useLazyGetLanguagesQuery } = languageApi;

// Export the endpoint matcher for use in middleware
export const languageApiEndpoints = languageApi.endpoints;
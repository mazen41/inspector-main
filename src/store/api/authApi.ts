import { apiSlice } from './apiSlice';
import type { LoginCredentials, AuthResponse, User } from '../../types';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: any) => {
        // Transform backend response to match frontend expectations
        return {
          token: response.data.access_token,
          user: response.data.user,
          expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
        };
      },
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/refresh',
        method: 'POST',
      }),
      transformResponse: (response: any) => {
        // Transform backend response to match frontend expectations
        return {
          token: response.data.access_token,
          user: response.data.user || null, // User might not be included in refresh response
          expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
        };
      },
      invalidatesTags: ['Auth'],
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => '/me',
      transformResponse: (response: any) => {
        // Transform backend response to match frontend expectations
        return response.data.user;
      },
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
} = authApi;
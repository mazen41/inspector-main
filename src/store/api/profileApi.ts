import { apiSlice } from './apiSlice';
import type { 
  InspectorProfile, 
  ProfileUpdateData, 
  PasswordChangeData, 
  BusinessSettings,
  Country,
  State,
  City
} from '../../types';

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<{ data: InspectorProfile }, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<{ data: InspectorProfile }, ProfileUpdateData>({
      query: (data) => ({
        url: '/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile', 'Auth'],
    }),
    changePassword: builder.mutation<void, PasswordChangeData>({
      query: (data) => ({
        url: '/profile/password',
        method: 'PUT',
        body: data,
      }),
    }),
    uploadAvatar: builder.mutation<{ data: { avatar_url: string } }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        
        return {
          url: '/profile/avatar',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Profile', 'Auth'],
    }),
    updateBusinessSettings: builder.mutation<{ data: InspectorProfile }, BusinessSettings>({
      query: (settings) => ({
        url: '/profile/business-settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Profile'],
    }),
    getCountries: builder.query<{ data: Country[] }, void>({
      query: () => '/countries',
    }),
    getStatesByCountry: builder.query<{ data: State[] }, number>({
      query: (countryId) => `/states-by-country/${countryId}`,
    }),
    getCitiesByState: builder.query<{ data: City[] }, number>({
      query: (stateId) => `/cities-by-state/${stateId}`,
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useUpdateBusinessSettingsMutation,
  useGetCountriesQuery,
  useGetStatesByCountryQuery,
  useGetCitiesByStateQuery,
} = profileApi;
import { apiSlice } from './apiSlice';
import type {
  CarLookupItem,
  City,
  Country,
  InspectionTypeLookup,
  ManualExaminationCreatePayload,
  ManualExaminationDetailResponse,
  ManualExaminationFilters,
  ManualExaminationListResponse,
  ManualExaminationPhotoUploadPayload,
  ManualExaminationPhotoUploadResponse,
  State,
} from '../../types';

const carsApiUrl = (path: string) =>
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/cars${path}`;

export const manualExaminationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getManualExaminations: builder.query<ManualExaminationListResponse, ManualExaminationFilters>({
      query: (filters) => ({
        url: '/manual-examinations',
        params: filters,
      }),
      providesTags: ['ManualExamination'],
    }),
    getManualExamination: builder.query<ManualExaminationDetailResponse['data'], number>({
      query: (id) => `/manual-examinations/${id}`,
      transformResponse: (response: ManualExaminationDetailResponse) => response.data,
      providesTags: (_, __, id) => [{ type: 'ManualExamination', id }],
    }),
    createManualExamination: builder.mutation<ManualExaminationDetailResponse, ManualExaminationCreatePayload>({
      query: (body) => ({
        url: '/manual-examinations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ManualExamination'],
    }),
    uploadManualExaminationVehiclePhotos: builder.mutation<ManualExaminationPhotoUploadResponse, ManualExaminationPhotoUploadPayload>({
      query: ({ manualExaminationId, files }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('photos[]', file));
        return {
          url: `/manual-examinations/${manualExaminationId}/vehicle-photos`,
          method: 'POST',
          body: formData,
        };
      },
    }),
    uploadManualExaminationSectionPhotos: builder.mutation<ManualExaminationPhotoUploadResponse, ManualExaminationPhotoUploadPayload>({
      query: ({ manualExaminationId, files, sectionId }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('photos[]', file));
        if (sectionId !== undefined) {
          formData.append('section_id', String(sectionId));
        }
        return {
          url: `/manual-examinations/${manualExaminationId}/section-photos`,
          method: 'POST',
          body: formData,
        };
      },
    }),
    getCarBrands: builder.query<CarLookupItem[], void>({
      query: () => carsApiUrl('/brands'),
      transformResponse: (response: { brands: CarLookupItem[] }) => response.brands || [],
      keepUnusedDataFor: 300,
    }),
    getCarModelsByBrand: builder.query<CarLookupItem[], number | undefined>({
      query: (brandId) => carsApiUrl(brandId ? `/brands/${brandId}/models` : '/models'),
      transformResponse: (response: { models: CarLookupItem[] }) => response.models || [],
      keepUnusedDataFor: 300,
    }),
    getCarCategories: builder.query<CarLookupItem[], void>({
      query: () => carsApiUrl('/categories?parent_only=1'),
      transformResponse: (response: { categories: CarLookupItem[] }) => response.categories || [],
      keepUnusedDataFor: 300,
    }),
    getCarColors: builder.query<CarLookupItem[], void>({
      query: () => carsApiUrl('/colors'),
      transformResponse: (response: { colors: CarLookupItem[] }) => response.colors || [],
      keepUnusedDataFor: 300,
    }),
    getCarFeatures: builder.query<CarLookupItem[], void>({
      query: () => carsApiUrl('/features'),
      transformResponse: (response: { features: CarLookupItem[] }) => response.features || [],
      keepUnusedDataFor: 300,
    }),
    getCarCustomFields: builder.query<CarLookupItem[], void>({
      query: () => carsApiUrl('/custom-fields'),
      transformResponse: (response: { custom_fields: CarLookupItem[] }) => response.custom_fields || [],
      keepUnusedDataFor: 300,
    }),
    getCarInspectionTypes: builder.query<InspectionTypeLookup[], void>({
  query: () => carsApiUrl('/inspection-types'),
  transformResponse: (response: {
    success?: boolean;
    data?: {
      car_inspection_types?: InspectionTypeLookup[];
    };
    car_inspection_types?: InspectionTypeLookup[];
  }) => {
    return response.data?.car_inspection_types || response.car_inspection_types || [];
  },
  keepUnusedDataFor: 300,
}),

    getManualCountries: builder.query<{ data: Country[] }, void>({
      query: () => '/countries',
      keepUnusedDataFor: 300,
    }),
    getManualStatesByCountry: builder.query<{ data: State[] }, number>({
      query: (countryId) => `/states-by-country/${countryId}`,
      keepUnusedDataFor: 300,
    }),
    getManualCitiesByState: builder.query<{ data: City[] }, number>({
      query: (stateId) => `/cities-by-state/${stateId}`,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetManualExaminationsQuery,
  useGetManualExaminationQuery,
  useCreateManualExaminationMutation,
  useUploadManualExaminationVehiclePhotosMutation,
  useUploadManualExaminationSectionPhotosMutation,
  useGetCarBrandsQuery,
  useGetCarModelsByBrandQuery,
  useGetCarCategoriesQuery,
  useGetCarColorsQuery,
  useGetCarFeaturesQuery,
  useGetCarCustomFieldsQuery,
  useGetCarInspectionTypesQuery,
  useGetManualCountriesQuery,
  useGetManualStatesByCountryQuery,
  useGetManualCitiesByStateQuery,
} = manualExaminationApi;

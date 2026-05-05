import { apiSlice } from './apiSlice';
import { transformFieldValueForAPI, transformFieldValueFromAPI } from '../../utils/fieldValueTransforms';
import type {
  Inspection,
  InspectionFilters,
  InspectionPhoto,
  ApiResponse,
  FieldValue
} from '../../types';

export const inspectionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInspections: builder.query<ApiResponse<Inspection[]>, InspectionFilters>({
      query: (filters) => ({
        url: '/inspections',
        params: filters,
      }),
      providesTags: ['Inspection'],
    }),
    getInspection: builder.query<Inspection, number>({
      query: (id) => `/inspections/${id}`,
      transformResponse: (response: any) => {
        // Handle both direct response and wrapped response
        const inspection = response.data || response;



        // Transform field values from API format
        if (inspection.field_values && Array.isArray(inspection.field_values)) {

          inspection.field_values = inspection.field_values.map((fv: any) => ({
            ...fv,
            value: transformFieldValueFromAPI(fv.value, fv.field?.field_type || fv.field?.type),
          }));
        }

        // Transform field values in sections if present (direct sections)
        if (inspection.sections) {
          inspection.sections.forEach((section: any) => {
            if (section.fields) {
              section.fields.forEach((field: any) => {
                if (field.value !== undefined) {
                  field.value = transformFieldValueFromAPI(field.value, field.field_type || field.type);
                }
              });
            }
          });
        }

        // Transform field values in sections if present (nested in inspection_type)
        if (inspection.inspection_type?.sections) {
          inspection.inspection_type.sections.forEach((section: any) => {
            if (section.fields) {
              section.fields.forEach((field: any) => {
                if (field.value !== undefined) {
                  field.value = transformFieldValueFromAPI(field.value, field.field_type || field.type);
                }
              });
            }
          });
        }

        return inspection;
      },
      providesTags: (_, __, id) => [{ type: 'Inspection', id }],
    }),
    startInspection: builder.mutation<Inspection, number>({
      query: (id) => ({
        url: `/inspections/${id}/start`,
        method: 'PUT',
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (_, __, id) => [
        { type: 'Inspection', id },
        'Dashboard',
      ],
    }),
    completeInspection: builder.mutation<
      Inspection,
      number | {
        id: number;
        completion_data?: {
          total_score: number;
          inspector_notes: string;
          overall_condition: string;
          recommendations: string;
        }
      }
    >({
      query: (params) => {
        const id = typeof params === 'number' ? params : params.id;
        const body = typeof params === 'object' && params.completion_data ? params.completion_data : undefined;

        return {
          url: `/inspections/${id}/complete`,
          method: 'PUT',
          body,
        };
      },
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (_, __, params) => {
        const id = typeof params === 'number' ? params : params.id;
        return [
          { type: 'Inspection', id },
          'Dashboard',
          'Payment',
        ];
      },
    }),
    cancelInspection: builder.mutation<Inspection, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/inspections/${id}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (_, __, { id }) => [
        { type: 'Inspection', id },
        'Dashboard',
      ],
    }),
    updateFieldValues: builder.mutation<
      {},
      {
        id: number;
        fieldValues: Array<{
          field_id: number;
          value: FieldValue;
          notes?: string;
          photos?: InspectionPhoto[];
        }>
      }
    >({
      query: ({ id, fieldValues }) => {
        // Transform field values to ensure proper serialization
        const transformedValues = fieldValues.map(fv => ({
          field_id: fv.field_id,
          value: transformFieldValueForAPI(fv.value),
          notes: fv.notes || '',
          // Include photo IDs for association (photos are uploaded separately)
          photo_ids: fv.photos?.map(photo => photo.id) || [],
        }));

        return {
          url: `/inspections/${id}/field-values`,
          method: 'POST',
          body: { field_values: transformedValues },
        };
      },
      invalidatesTags: (_, __, { id }) => [{ type: 'Inspection', id }],
    }),
    uploadInspectionPhoto: builder.mutation<
      {
        field_id: string;
        uploaded_photos: InspectionPhoto[];
        total_attachments: number;
        message?: string;
      },
      {
        id: number;
        file: File;
        fieldId?: number;
        caption?: string;
        metadata?: Record<string, any>;
      }
    >({
      query: ({ id, file, fieldId, caption, metadata }) => {
        // Validate file before upload
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

        if (file.size > maxSize) {
          throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB`);
        }

        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type "${file.type}" is not supported. Allowed types: ${allowedTypes.join(', ')}`);
        }

        const formData = new FormData();
        formData.append('photos[]', file);

        if (fieldId) {
          formData.append('field_id', fieldId.toString());
        }

        if (caption) {
          formData.append('caption', caption);
        }

        if (metadata) {
          formData.append('metadata', JSON.stringify(metadata));
        }

        return {
          url: `/inspections/${id}/upload-photos`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      transformResponse: (response: any) => {
        return response.data || response;
      },
      invalidatesTags: (_, __, { id }) => [{ type: 'Inspection', id }],
    }),

    // Batch photo upload for multiple files
    batchUploadInspectionPhotos: builder.mutation<
      {
        field_id: string;
        uploaded_photos: InspectionPhoto[];
        total_attachments: number;
        failed_uploads?: Array<{ file_name: string; error: string }>;
        message?: string;
      },
      {
        id: number;
        files: File[];
        fieldId?: number;
        captions?: string[];
        metadata?: Record<string, any>;
      }
    >({
      query: ({ id, files, fieldId, captions, metadata }) => {
        // Validate all files before upload
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

        for (const file of files) {
          if (file.size > maxSize) {
            throw new Error(`File "${file.name}" size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB`);
          }

          if (!allowedTypes.includes(file.type)) {
            throw new Error(`File "${file.name}" type "${file.type}" is not supported. Allowed types: ${allowedTypes.join(', ')}`);
          }
        }

        const formData = new FormData();

        // Append all files
        files.forEach((file, index) => {
          formData.append('photos[]', file);

          // Add individual captions if provided
          if (captions && captions[index]) {
            formData.append(`captions[${index}]`, captions[index]);
          }
        });

        if (fieldId) {
          formData.append('field_id', fieldId.toString());
        }

        if (metadata) {
          formData.append('metadata', JSON.stringify(metadata));
        }

        return {
          url: `/inspections/${id}/upload-photos/batch`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      transformResponse: (response: any) => {
        return response.data || response;
      },
      invalidatesTags: (_, __, { id }) => [{ type: 'Inspection', id }],
    }),

    // Delete individual photo
    deleteInspectionPhoto: builder.mutation<
      { success: boolean; message?: string },
      { inspectionId: number; photoId: number }
    >({
      query: ({ inspectionId, photoId }) => ({
        url: `/inspections/${inspectionId}/photos/${photoId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => {
        return response.data || response;
      },
      invalidatesTags: (_, __, { inspectionId }) => [{ type: 'Inspection', id: inspectionId }],
    }),

    // Remove photo from field
    removeFieldPhoto: builder.mutation<
      { success: boolean; message?: string },
      { inspectionId: number; fieldId: number; photoId: number }
    >({
      query: ({ inspectionId, fieldId, photoId }) => ({
        url: `/inspections/${inspectionId}/remove-photo`,
        method: 'POST',
        body: {
          field_id: fieldId,
          photo_id: photoId,
        },
      }),
      transformResponse: (response: any) => {
        return response.data || response;
      },
      invalidatesTags: (_, __, { inspectionId }) => [{ type: 'Inspection', id: inspectionId }],
    }),


    // Get field validation rules for a specific inspection type
    getFieldValidationRules: builder.query<
      Array<{ field_id: number; rules: any[] }>,
      number
    >({
      query: (inspectionTypeId) => `/inspection-types/${inspectionTypeId}/validation-rules`,
      transformResponse: (response: any) => response.data || response,
      providesTags: (_, __, inspectionTypeId) => [
        { type: 'Inspection', id: `type-${inspectionTypeId}` }
      ],
    }),
  }),
});

export const {
  useGetInspectionsQuery,
  useGetInspectionQuery,
  useStartInspectionMutation,
  useCompleteInspectionMutation,
  useCancelInspectionMutation,
  useUpdateFieldValuesMutation,
  useUploadInspectionPhotoMutation,
  useBatchUploadInspectionPhotosMutation,
  useDeleteInspectionPhotoMutation,
  useRemoveFieldPhotoMutation,
  useGetFieldValidationRulesQuery,
} = inspectionApi;
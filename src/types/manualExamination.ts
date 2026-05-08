import type { ApiFilters, PaginationMeta } from './api';
import type { FieldType } from './inspection';

export interface ManualExaminationListItem {
  id: number;
  inspection_number: string;
  status: string;
  status_display?: string;
  created_at: string | null;
  completed_at: string | null;
  car: {
    id: number | null;
    make: string | null;
    model: string | null;
    year: number | null;
    plate_number: string | null;
    vin: string | null;
  };
}

export interface ManualExaminationDetail extends ManualExaminationListItem {
  car: ManualExaminationListItem['car'] & {
    description?: string | null;
    category?: string | null;
    color?: string | null;
    condition?: string | null;
    milage?: string | number | null;
    transmission?: string | null;
    fuel_type?: string | null;
    location?: string | null;
    price?: string | number | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    main_photo?: number | null;
    photos?: string | null;
    features?: Array<{ id: number; name: string | null; section?: string | null }>;
    custom_fields?: Array<{ id: number; name: string | null; value: unknown }>;
  };
  inspection_type?: {
    id: number | null;
    name: string | null;
    description?: string | null;
  };
  total_score?: string | number | null;
  overall_condition?: string | null;
  condition_display?: string | null;
  inspector_notes?: string | null;
  recommendations?: string | null;
  summary?: unknown;
  metadata?: Record<string, unknown>;
  sections?: ManualExaminationSection[];
}

export interface ManualExaminationSection {
  id: number;
  name: string;
  description?: string | null;
  order?: number;
  section_photos?: Array<{ path: string; url?: string }>;
  fields: ManualExaminationField[];
}

export interface ManualExaminationField {
  id: number;
  name: string;
  description?: string | null;
  type: FieldType;
  is_required: boolean;
  options?: { options?: string[] } | string[] | null;
  order?: number;
  value?: unknown;
  raw_value?: unknown;
  score?: string | number | null;
  notes?: string | null;
  is_flagged?: boolean;
  flag_reason?: string | null;
  photos?: unknown[];
}

export interface ManualExaminationFilters extends ApiFilters {
  status?: string;
}

export interface ManualExaminationListResponse {
  data: ManualExaminationListItem[];
  meta: PaginationMeta;
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
}

export interface ManualExaminationDetailResponse {
  data: ManualExaminationDetail;
  message?: string;
}

export interface ManualExaminationCarPayload {
  vin: string;
  plate_number?: string;
  description: string;
  brand_id: number;
  model_id: number;
  category_id?: number;
  color_id: number;
  condition: 'new' | 'used';
  milage: number;
  manufacture_year: number;
  transmission: string;
  fuel_type: string;
  location: string;
  price?: number;
  country_id: number;
  state_id: number;
  city_id?: number;
  main_photo: number;
  photos?: string;
  features?: number[];
  custom_fields?: Array<{ field_id: number; value: unknown }>;
}

export interface ManualExaminationFieldValuePayload {
  field_id: number;
  value: unknown;
  score?: number;
  notes?: string;
  is_flagged?: boolean;
  flag_reason?: string;
}

export interface ManualExaminationCreatePayload {
  car: ManualExaminationCarPayload;
  inspection_type_id?: number;
  field_values: ManualExaminationFieldValuePayload[];
  total_score?: number;
  overall_condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  inspector_notes?: string;
  recommendations?: string;
}

export interface CarLookupItem {
  id: number;
  name: string;
  brand_id?: number;
  hex_code?: string;
  logo?: string;
  value?: string;
  label?: string;
  options?: Array<{ id?: number; value: string; label: string }>;
  required?: boolean;
  type?: string;
}

export interface InspectionTypeLookup {
  id: number;
  name: string;
  description?: string;
  price?: number;
  sections?: Array<{
    id: number;
    name: string;
    description?: string;
    order?: number;
    fields: Array<{
      id: number;
      name: string;
      type: FieldType;
      is_required: boolean;
      options?: { options?: string[] } | string[] | null;
      order?: number;
    }>;
  }>;
}

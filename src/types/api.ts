export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface ApiFilters {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
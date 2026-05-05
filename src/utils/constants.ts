export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    ME: '/me',
  },
  DASHBOARD: {
    STATS: '/dashboard',
    ANALYTICS: '/dashboard/analytics',
  },
  INSPECTIONS: {
    LIST: '/inspections',
    DETAIL: (id: number) => `/inspections/${id}`,
    START: (id: number) => `/inspections/${id}/start`,
    COMPLETE: (id: number) => `/inspections/${id}/complete`,
    CANCEL: (id: number) => `/inspections/${id}/cancel`,
    FIELD_VALUES: (id: number) => `/inspections/${id}/field-values`,
    UPLOAD: (id: number) => `/inspections/${id}/upload`,
    UPLOAD_PHOTOS: (id: number) => `/inspections/${id}/upload-photos`,
    BATCH_UPLOAD_PHOTOS: (id: number) => `/inspections/${id}/upload-photos/batch`,
    DELETE_PHOTO: (inspectionId: number, photoId: number) => `/inspections/${inspectionId}/photos/${photoId}`,
  },
  PAYMENTS: {
    LIST: '/payments',
    DETAIL: (id: number) => `/payments/${id}`,
    SUMMARY: '/payments/summary',
  },
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    PASSWORD: '/profile/password',
    AVATAR: '/profile/avatar',
    BUSINESS_SETTINGS: '/profile/business-settings',
  },
} as const;

export const INSPECTION_STATUSES = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
  // Legacy field types for backward compatibility
  MULTISELECT: 'multiselect',
  PHOTO: 'photo',
} as const;

export const FIELD_TYPE_LABELS = {
  [FIELD_TYPES.TEXT]: 'Text Input',
  [FIELD_TYPES.TEXTAREA]: 'Textarea',
  [FIELD_TYPES.BOOLEAN]: 'Yes/No',
  [FIELD_TYPES.NUMBER]: 'Number',
  [FIELD_TYPES.SELECT]: 'Dropdown Select',
  [FIELD_TYPES.CHECKBOX]: 'Checkboxes',
  [FIELD_TYPES.RADIO]: 'Radio Buttons',
  [FIELD_TYPES.DATE]: 'Date Picker',
  [FIELD_TYPES.EMAIL]: 'Email',
  [FIELD_TYPES.URL]: 'URL',
  // Legacy field types
  [FIELD_TYPES.MULTISELECT]: 'Multi-Select (Legacy)',
  [FIELD_TYPES.PHOTO]: 'Photo Upload',
} as const;

export const VALIDATION_RULES = {
  REQUIRED: 'required',
  NULLABLE: 'nullable',
  EMAIL: 'email',
  URL: 'url',
  NUMERIC: 'numeric',
  DATE: 'date',
  BOOLEAN: 'boolean',
  MIN: 'min',
  MAX: 'max',
  MIN_LENGTH: 'min_length',
  MAX_LENGTH: 'max_length',
  REGEX: 'regex',
} as const;

export const FIELD_VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  URL: 'Please enter a valid URL',
  NUMERIC: 'Please enter a valid number',
  DATE: 'Please enter a valid date',
  MIN: 'Value must be at least {min}',
  MAX: 'Value must be at most {max}',
  MIN_LENGTH: 'Must be at least {min} characters',
  MAX_LENGTH: 'Must be at most {max} characters',
} as const;

export const FIELD_DEFAULTS = {
  BOOLEAN_TRUE_LABEL: 'Yes',
  BOOLEAN_FALSE_LABEL: 'No',
  EMPTY_VALUE_DISPLAY: 'Not completed',
  MULTIPLE_VALUES_SEPARATOR: ', ',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATE_DISPLAY_FORMAT: 'MMM DD, YYYY',
} as const;

export const FORM_SETTINGS = {
  VALIDATION_DEBOUNCE_MS: 150, // Reduced from 300ms for better responsiveness
  UNSAVED_CHANGES_WARNING: 'You have unsaved changes that will be lost. Are you sure you want to leave?',
} as const;

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  NUMERIC: /^-?\d*\.?\d+$/,
} as const;

export const INPUT_CONSTRAINTS = {
  TEXT_MAX_LENGTH: 255,
  TEXTAREA_MAX_LENGTH: 2000,
  NUMBER_MIN: -999999999,
  NUMBER_MAX: 999999999,
  URL_MAX_LENGTH: 2048,
  EMAIL_MAX_LENGTH: 254,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  MAX_PHOTOS_PER_FIELD: 10,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  INSPECTIONS: '/inspections',
  INSPECTION_DETAIL: '/inspections/:id',
  INSPECTION_EDIT: '/inspections/:id/edit',
  PAYMENTS: '/payments',
  PROFILE: '/profile',
} as const;
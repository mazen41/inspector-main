export interface Language {
  id: number;
  name: string;
  code: string;
  mobile_app_code: string;
  rtl: boolean;
  is_default: boolean;
  image: string;
}

export interface LanguageResponse {
  data: Language[];
  success: boolean;
  status: number;
}

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

export interface TranslationNamespace {
  [namespace: string]: TranslationKeys;
}

export interface LocalizationState {
  currentLanguage: Language | null;
  availableLanguages: Language[];
  translations: Record<string, TranslationNamespace>;
  isLoading: boolean;
  error: string | null;
}

export interface LocalizationContextType {
  currentLanguage: Language | null;
  availableLanguages: Language[];
  changeLanguage: (languageCode: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isRTL: boolean;
  isLoading: boolean;
}

export interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: Language | null;
  isRTL: boolean;
  changeLanguage: (code: string) => void;
  isLoading: boolean;
}

export interface TranslationError {
  type: 'MISSING_KEY' | 'MISSING_TRANSLATION' | 'API_ERROR' | 'LOAD_ERROR';
  key?: string;
  language?: string;
  message: string;
  timestamp: Date;
}
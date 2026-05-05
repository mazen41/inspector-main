import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Language, LocalizationState, TranslationNamespace } from '../../types/localization';

const initialState: LocalizationState = {
  currentLanguage: null,
  availableLanguages: [],
  translations: {},
  isLoading: false,
  error: null,
};

export const localizationSlice = createSlice({
  name: 'localization',
  initialState,
  reducers: {
    setCurrentLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
      state.error = null;
    },
    setAvailableLanguages: (state, action: PayloadAction<Language[]>) => {
      state.availableLanguages = action.payload;
      state.error = null;
    },
    setTranslations: (state, action: PayloadAction<{ languageCode: string; translations: TranslationNamespace }>) => {
      const { languageCode, translations } = action.payload;
      state.translations[languageCode] = translations;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetLocalization: (state) => {
      state.currentLanguage = null;
      state.availableLanguages = [];
      state.translations = {};
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setCurrentLanguage,
  setAvailableLanguages,
  setTranslations,
  setLoading,
  setError,
  clearError,
  resetLocalization,
} = localizationSlice.actions;

export default localizationSlice.reducer;
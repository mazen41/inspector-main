import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { setCurrentLanguage } from '../slices/localizationSlice';
import { apiSlice } from '../api/apiSlice';
import type { RootState } from '../index';

// Create listener middleware for localization actions
export const localizationMiddleware = createListenerMiddleware();

// Listen for language changes and invalidate API cache
localizationMiddleware.startListening({
  matcher: isAnyOf(setCurrentLanguage),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const previousLanguage = state.localization.currentLanguage;
    
    // If this is a language change (not initial load), invalidate relevant API cache
    if (previousLanguage && (action.payload as any).code !== previousLanguage.code) {
      // Invalidate all cached data that might contain localized content
      listenerApi.dispatch(
        apiSlice.util.invalidateTags([
          'Dashboard',
          'Inspection', 
          'Payment',
          'Profile'
        ])
      );
    }
  },
});

export default localizationMiddleware;
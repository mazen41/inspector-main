import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authSlice } from './slices/authSlice';
import { localizationSlice } from './slices/localizationSlice';
import { apiSlice } from './api/apiSlice';
import { localizationMiddleware } from './middleware/localizationMiddleware';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    localization: localizationSlice.reducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(apiSlice.middleware)
    .prepend(localizationMiddleware.middleware),
  devTools: import.meta.env.DEV,
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
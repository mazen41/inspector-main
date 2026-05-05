import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

// Get stored token and user data
const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('inspector_token');
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const userData = localStorage.getItem('inspector_user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const storedToken = getStoredToken();
const storedUser = getStoredUser();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!(storedToken && storedUser),
  isLoading: false,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isInitialized = true;
      
      // Store in localStorage
      try {
        localStorage.setItem('inspector_token', token);
        localStorage.setItem('inspector_user', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to store auth data:', error);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      
      // Clear localStorage
      try {
        localStorage.removeItem('inspector_token');
        localStorage.removeItem('inspector_user');
      } catch (error) {
        console.error('Failed to clear auth data:', error);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        const updatedUser = { ...state.user, ...action.payload };
        state.user = updatedUser;
        
        // Update localStorage
        try {
          localStorage.setItem('inspector_user', JSON.stringify(updatedUser));
        } catch (error) {
          console.error('Failed to update user data:', error);
        }
      }
    },
    initializeAuth: (state) => {
      state.isInitialized = true;
    },
    clearAuthError: (state) => {
      // This can be used to clear any auth-related errors
      state.isLoading = false;
    },
  },
});

export const { 
  setCredentials, 
  logout, 
  setLoading, 
  updateUser, 
  initializeAuth, 
  clearAuthError 
} = authSlice.actions;

export default authSlice.reducer;
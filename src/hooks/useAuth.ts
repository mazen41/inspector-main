import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import type { RootState } from '../store';
import { logout, setCredentials, initializeAuth, setLoading } from '../store/slices/authSlice';
import { 
  useLoginMutation, 
  useLogoutMutation, 
  useGetCurrentUserQuery,
  useRefreshTokenMutation 
} from '../store/api/authApi';
import type { LoginCredentials } from '../types';
import { ROUTES } from '../utils/constants';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();
  
  // Keep server-side permission changes reflected in the local session.
  const { 
    data: currentUserData, 
    error: currentUserError,
    isLoading: isCurrentUserLoading 
  } = useGetCurrentUserQuery(undefined, {
    skip: !token || !isAuthenticated,
  });

  // Initialize authentication state on app load
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  // Handle current user data
  useEffect(() => {
    if (currentUserData && token) {
      dispatch(setCredentials({
        user: currentUserData,
        token,
      }));
    }
  }, [currentUserData, token, dispatch]);

  // Handle authentication errors (invalid token, etc.)
  useEffect(() => {
    if (currentUserError && token) {
      console.error('Authentication error:', currentUserError);
      dispatch(logout());
    }
  }, [currentUserError, token, dispatch]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch(setLoading(true));
      const response = await loginMutation(credentials).unwrap();
      dispatch(setCredentials({
        user: response.user,
        token: response.token,
      }));
      navigate(ROUTES.DASHBOARD);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.error?.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      if (token) {
        await logoutMutation().unwrap();
      }
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout API failed:', error);
    } finally {
      dispatch(logout());
      navigate(ROUTES.LOGIN);
    }
  }, [logoutMutation, dispatch, navigate, token]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!token) return false;
      
      const response = await refreshTokenMutation().unwrap();
      dispatch(setCredentials({
        user: response.user,
        token: response.token,
      }));
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch(logout());
      return false;
    }
  }, [refreshTokenMutation, dispatch, token]);

  // Check if token is expired (basic check - you might want to decode JWT for more accurate check)
  const isTokenExpired = useCallback((): boolean => {
    if (!token) return true;
    
    try {
      // Basic check - in a real app, you'd decode the JWT and check the exp claim
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return tokenData.exp < currentTime;
    } catch {
      return true;
    }
  }, [token]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isLoginLoading || isCurrentUserLoading,
    isInitialized,
    login,
    logout: logoutUser,
    refreshToken,
    isTokenExpired,
  };
};

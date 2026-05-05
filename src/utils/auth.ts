import type { User } from '../types';

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('inspector_token');
  return !!token;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('inspector_token');
};

export const clearAuthData = (): void => {
  localStorage.removeItem('inspector_token');
};

export const isCarInspector = (user: User | null): boolean => {
  return user?.user_type === 'car_inspector';
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
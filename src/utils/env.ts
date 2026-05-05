/**
 * Environment Configuration Utility
 * Provides type-safe access to environment variables with defaults
 */

interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;
  apiVersion: string;
  apiTimeout: number;
  apiSecure: boolean;

  // Application Configuration
  appName: string;
  appVersion: string;
  appDescription: string;

  // Development Configuration
  isDevelopment: boolean;
  isDebugEnabled: boolean;
  showDevTools: boolean;

  // Authentication Configuration
  jwtStorageKey: string;
  jwtRefreshThreshold: number;
  sessionTimeout: number;

  // Feature Flags
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableOfflineMode: boolean;

  // UI Configuration
  defaultTheme: 'light' | 'dark';
  enableDarkMode: boolean;
  defaultLanguage: string;
  enableRTL: boolean;

  // File Upload Configuration
  maxFileSize: number;
  allowedFileTypes: string[];
  uploadChunkSize: number;

  // Pagination Configuration
  defaultPageSize: number;
  maxPageSize: number;

  // Cache Configuration
  cacheTTL: number;
  enableServiceWorker: boolean;

  // Error Handling
  errorBoundaryEnabled: boolean;
  sentryDSN?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // Performance Configuration
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  prefetchRoutes: boolean;

  // Security Configuration
  enableCSP: boolean;
  allowedHosts: string[];
  secureCookies: boolean;

  // Analytics
  googleAnalyticsId?: string;
  mixpanelToken?: string;
  hotjarId?: string;

  // Third-party Services
  pusherAppKey?: string;
  pusherCluster?: string;
  websocketUrl?: string;
}

// Helper function to get environment variable with type conversion
const getEnvVar = <T>(
  key: string,
  defaultValue: T,
  transform?: (value: string) => T
): T => {
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (transform) {
    try {
      return transform(value);
    } catch (error) {
      console.warn(`Failed to transform env var ${key}:`, error);
      return defaultValue;
    }
  }

  return value as T;
};

// Overload for array transformation
const getEnvVarArray = (
  key: string,
  defaultValue: string,
  transform: (value: string) => string[]
): string[] => {
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    return transform(defaultValue);
  }

  try {
    return transform(value);
  } catch (error) {
    console.warn(`Failed to transform env var ${key}:`, error);
    return transform(defaultValue);
  }
};

// Type conversion helpers
const toBool = (value: string): boolean => {
  return value.toLowerCase() === 'true' || value === '1';
};

const toNumber = (value: string): number => {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
};

const toArray = (value: string, separator = ','): string[] => {
  return value.split(separator).map(item => item.trim()).filter(Boolean);
};

// Environment configuration object
export const env: EnvironmentConfig = {
  // API Configuration
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://samh.test'),
  apiVersion: getEnvVar('VITE_API_VERSION', 'v2'),
  apiTimeout: getEnvVar('VITE_API_TIMEOUT', 30000, toNumber),
  apiSecure: getEnvVar('VITE_API_SECURE', false, toBool),

  // Application Configuration
  appName: getEnvVar('VITE_APP_NAME', 'Car Inspector Dashboard'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  appDescription: getEnvVar('VITE_APP_DESCRIPTION', 'Dashboard for car inspectors'),

  // Development Configuration
  isDevelopment: getEnvVar('VITE_DEV_MODE', import.meta.env.DEV, toBool),
  isDebugEnabled: getEnvVar('VITE_DEBUG', import.meta.env.DEV, toBool),
  showDevTools: getEnvVar('VITE_SHOW_DEV_TOOLS', import.meta.env.DEV, toBool),

  // Authentication Configuration
  jwtStorageKey: getEnvVar('VITE_JWT_STORAGE_KEY', 'car_inspector_token'),
  jwtRefreshThreshold: getEnvVar('VITE_JWT_REFRESH_THRESHOLD', 300000, toNumber),
  sessionTimeout: getEnvVar('VITE_SESSION_TIMEOUT', 3600000, toNumber),

  // Feature Flags
  enableAnalytics: getEnvVar('VITE_ENABLE_ANALYTICS', false, toBool),
  enableErrorReporting: getEnvVar('VITE_ENABLE_ERROR_REPORTING', false, toBool),
  enablePerformanceMonitoring: getEnvVar('VITE_ENABLE_PERFORMANCE_MONITORING', false, toBool),
  enableOfflineMode: getEnvVar('VITE_ENABLE_OFFLINE_MODE', false, toBool),

  // UI Configuration
  defaultTheme: getEnvVar('VITE_DEFAULT_THEME', 'light') as 'light' | 'dark',
  enableDarkMode: getEnvVar('VITE_ENABLE_DARK_MODE', true, toBool),
  defaultLanguage: getEnvVar('VITE_DEFAULT_LANGUAGE', 'en'),
  enableRTL: getEnvVar('VITE_ENABLE_RTL', false, toBool),

  // File Upload Configuration
  maxFileSize: getEnvVar('VITE_MAX_FILE_SIZE', 10485760, toNumber), // 10MB
  allowedFileTypes: getEnvVarArray('VITE_ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/webp,application/pdf', toArray),
  uploadChunkSize: getEnvVar('VITE_UPLOAD_CHUNK_SIZE', 1048576, toNumber), // 1MB

  // Pagination Configuration
  defaultPageSize: getEnvVar('VITE_DEFAULT_PAGE_SIZE', 10, toNumber),
  maxPageSize: getEnvVar('VITE_MAX_PAGE_SIZE', 100, toNumber),

  // Cache Configuration
  cacheTTL: getEnvVar('VITE_CACHE_TTL', 300000, toNumber), // 5 minutes
  enableServiceWorker: getEnvVar('VITE_ENABLE_SERVICE_WORKER', false, toBool),

  // Error Handling
  errorBoundaryEnabled: getEnvVar('VITE_ERROR_BOUNDARY_ENABLED', true, toBool),
  sentryDSN: getEnvVar('VITE_SENTRY_DSN', undefined),
  logLevel: getEnvVar('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',

  // Performance Configuration
  enableLazyLoading: getEnvVar('VITE_ENABLE_LAZY_LOADING', true, toBool),
  enableCodeSplitting: getEnvVar('VITE_ENABLE_CODE_SPLITTING', true, toBool),
  prefetchRoutes: getEnvVar('VITE_PREFETCH_ROUTES', true, toBool),

  // Security Configuration
  enableCSP: getEnvVar('VITE_ENABLE_CSP', true, toBool),
  allowedHosts: getEnvVarArray('VITE_ALLOWED_HOSTS', 'localhost,127.0.0.1', toArray),
  secureCookies: getEnvVar('VITE_SECURE_COOKIES', false, toBool),

  // Analytics
  googleAnalyticsId: getEnvVar('VITE_GOOGLE_ANALYTICS_ID', undefined),
  mixpanelToken: getEnvVar('VITE_MIXPANEL_TOKEN', undefined),
  hotjarId: getEnvVar('VITE_HOTJAR_ID', undefined),

  // Third-party Services
  pusherAppKey: getEnvVar('VITE_PUSHER_APP_KEY', undefined),
  pusherCluster: getEnvVar('VITE_PUSHER_CLUSTER', undefined),
  websocketUrl: getEnvVar('VITE_WEBSOCKET_URL', undefined),
};

// Validation function to check required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'apiBaseUrl',
    'appName',
    'appVersion',
  ];

  const missing = requiredVars.filter(key => {
    const value = env[key as keyof EnvironmentConfig];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate API URL format
  try {
    new URL(env.apiBaseUrl);
  } catch {
    throw new Error(`Invalid API base URL: ${env.apiBaseUrl}`);
  }

  // Log configuration in development
  if (env.isDevelopment && env.isDebugEnabled) {
    console.group('🔧 Environment Configuration');
    console.log('API Base URL:', env.apiBaseUrl);
    console.log('App Version:', env.appVersion);
    console.log('Debug Mode:', env.isDebugEnabled);
    console.log('Feature Flags:', {
      analytics: env.enableAnalytics,
      errorReporting: env.enableErrorReporting,
      performanceMonitoring: env.enablePerformanceMonitoring,
      offlineMode: env.enableOfflineMode,
    });
    console.groupEnd();
  }
};

// Export individual environment checks
export const isDevelopment = env.isDevelopment;
export const isProduction = !env.isDevelopment;
export const isDebugEnabled = env.isDebugEnabled;

// Export default configuration
export default env;
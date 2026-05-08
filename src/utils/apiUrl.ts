const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

/**
 * Build an API URL from the configured base URL.
 *
 * During local development, absolute localhost API URLs such as
 * `http://localhost/samh.store/api` are converted to same-origin paths so the
 * Vite dev proxy can forward requests without browser CORS preflights being
 * redirected by the backend/web server.
 */
export const getApiBaseUrl = () => {
  const configuredBaseUrl = trimTrailingSlashes(String(import.meta.env.VITE_API_BASE_URL || ''));

  if (typeof window === 'undefined' || !configuredBaseUrl) {
    return configuredBaseUrl;
  }

  try {
    const apiUrl = new URL(configuredBaseUrl);
    const appUrl = new URL(window.location.href);
    const isLocalApiHost = apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1';
    const isLocalAppHost = appUrl.hostname === 'localhost' || appUrl.hostname === '127.0.0.1';

    const apiPath = trimTrailingSlashes(apiUrl.pathname);

    if (isLocalApiHost && isLocalAppHost && apiUrl.origin !== appUrl.origin && apiPath) {
      return apiPath;
    }
  } catch {
    // Relative VITE_API_BASE_URL values are already same-origin safe.
  }

  return configuredBaseUrl;
};

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

export const buildInspectorApiUrl = (path: string) => {
  const version = String(import.meta.env.VITE_API_VERSION || '').replace(/^\/+|\/+$/g, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return buildApiUrl(`/${version}/inspector${normalizedPath}`);
};

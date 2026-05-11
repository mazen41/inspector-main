import { getApiBaseUrl } from './apiUrl';

/**
 * Build a full asset URL.
 * 
 * If the provided path is already an absolute URL (starts with http/https), 
 * it is returned as is.
 * 
 * If the path is relative, it prepends the backend base URL derived from 
 * the API base URL.
 * 
 * It also handles the 'public/' prefix which is common in some Laravel setups.
 */
export const buildAssetUrl = (path: string | null | undefined): string => {
  if (!path) return '';

  // Get the base API URL (e.g., https://samh.store/api or http://localhost/api)
  const apiBaseUrl = getApiBaseUrl();
  
  // Try to derive the root URL (e.g., https://samh.store)
  let rootUrl = '';
  try {
    const url = new URL(apiBaseUrl);
    // Remove /api or /public/api from the end
    rootUrl = url.origin + url.pathname.replace(/\/api\/?.*$/, '');
  } catch {
    // Fallback if URL parsing fails
    rootUrl = apiBaseUrl.replace(/\/api\/?.*$/, '');
  }
  rootUrl = rootUrl.replace(/\/+$/, '');

  // If it's already an absolute URL, check if it's from our backend
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      const rootOrigin = new URL(rootUrl).origin;
      
      // If the origin is different, we might need to fix it
      if (url.origin !== rootOrigin) {
        // Look for common Laravel asset path markers
        const match = url.pathname.match(/\/(public|storage|uploads|manual-examinations|manual-examination-reports)\/(.+)$/);
        if (match) {
          return `${rootUrl}${match[0]}`;
        }
      }
    } catch {
      // If URL parsing fails, return as is
    }
    return path;
  }

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Combine root URL and path
  return `${rootUrl}${normalizedPath}`;
};

/**
 * Specific helper for public assets (logo, placeholders)
 */
export const buildPublicAssetUrl = (path: string): string => {
  // If the path doesn't start with public/, we might need to add it 
  // depending on the backend configuration.
  // Based on user feedback, the working paths include /public/
  const publicPath = path.startsWith('public/') ? path : `public/${path}`;
  return buildAssetUrl(publicPath);
};

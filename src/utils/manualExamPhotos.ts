import type { InspectionPhoto } from '../types';

type RawPhoto = Partial<InspectionPhoto> & {
  id?: number | string;
  url?: string;
  thumbnail_url?: string;
  path?: string;
  file_path?: string;
  image?: string;
  src?: string;
  full_url?: string;
  original_url?: string;
  caption?: string;
  name?: string;
  uploaded_at?: string;
  created_at?: string;
};

const getApiAssetBaseUrl = () => {
  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

  try {
    const url = new URL(apiBaseUrl);
    url.pathname = url.pathname.replace(/\/api(?:\/.*)?$/i, '');
    return url.toString().replace(/\/+$/, '');
  } catch {
    return apiBaseUrl.replace(/\/api(?:\/.*)?$/i, '');
  }
};

export const resolvePhotoUrl = (value?: string | null) => {
  if (!value) return '';
  
  const assetBaseUrl = getApiAssetBaseUrl();

  if (/^(https?:|blob:|data:)/i.test(value)) {
    // If it's an absolute URL, check if it's from our backend but with potentially wrong domain
    if (value.startsWith('http')) {
      try {
        const url = new URL(value);
        const rootOrigin = new URL(assetBaseUrl).origin;
        
        if (url.origin !== rootOrigin) {
          // Look for common Laravel asset path markers
          const match = url.pathname.match(/\/(public|storage|uploads|manual-examinations)\/(.+)$/);
          if (match) {
            return `${assetBaseUrl}${match[0]}`;
          }
        }
      } catch {
        // Fallback to original value
      }
    }
    return value;
  }

  const cleanPath = value.replace(/^\/+/, '');

  if (cleanPath.startsWith('car-inspections/') || cleanPath.startsWith('storage/')) {
    const storagePath = cleanPath.replace(/^storage\//, '');
    return `${assetBaseUrl}/storage/${storagePath}`;
  }

  return `${assetBaseUrl}/${cleanPath}`;
};

export const parsePhotoCollection = (photos: unknown): unknown[] => {
  if (!photos) return [];
  if (Array.isArray(photos)) return photos;
  if (typeof photos === 'string') {
    const trimmed = photos.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [photos];
};

export const normalizePhotos = (photos: unknown, fallbackCaption: string, fieldName?: string): Array<InspectionPhoto & { fieldName?: string }> => (
  parsePhotoCollection(photos)
    .map((item, index) => {
      const raw: RawPhoto = typeof item === 'string' ? { url: item } : (item || {}) as RawPhoto;
      const url = resolvePhotoUrl(raw.url || raw.full_url || raw.original_url || raw.path || raw.file_path || raw.image || raw.src);
      const thumbnailUrl = resolvePhotoUrl(raw.thumbnail_url || raw.url || raw.path || raw.file_path || raw.image || raw.src);

      if (!url && !thumbnailUrl) return null;

      const numericId = Number(raw.id);
      return {
        id: Number.isFinite(numericId) ? numericId : -(index + 1),
        url: url || thumbnailUrl,
        thumbnail_url: thumbnailUrl || url,
        caption: raw.caption || raw.name || fallbackCaption,
        uploaded_at: raw.uploaded_at || raw.created_at || new Date().toISOString(),
        ...(fieldName ? { fieldName } : {}),
      } as InspectionPhoto & { fieldName?: string };
    })
    .filter((photo): photo is InspectionPhoto & { fieldName?: string } => Boolean(photo))
);

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Calendar, Camera, Car, CheckCircle, Download, ImageOff, Play, User, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useGetManualExaminationQuery } from '../store/api/manualExaminationApi';
import { useTranslation } from '../hooks/useTranslation';
import InspectionFieldValues from '../components/inspections/InspectionFieldValues';
import PhotoModal from '../components/inspections/PhotoModal';
import type { RootState } from '../store';
import type { FieldValue, Inspection, InspectionPhoto, InspectionSection, ManualExaminationDetail, ManualExaminationField } from '../types';

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

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const resolvePhotoUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const assetBaseUrl = getApiAssetBaseUrl();
  const cleanPath = value.replace(/^\/+/, '');

  // Handle storage paths specifically
  if (cleanPath.startsWith('car-inspections/') || cleanPath.startsWith('storage/')) {
    const storagePath = cleanPath.replace(/^storage\//, '');
    return `${assetBaseUrl}/storage/${storagePath}`;
  }

  return `${assetBaseUrl}/${cleanPath}`;
};

const parsePhotoCollection = (photos: unknown): unknown[] => {
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

const normalizePhotos = (photos: unknown, fallbackCaption: string, fieldName?: string): Array<InspectionPhoto & { fieldName?: string }> => (
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

const normalizeField = (field: ManualExaminationField) => ({
  id: field.id,
  name: field.name,
  description: field.description || undefined,
  field_type: field.type,
  type: field.type,
  is_required: field.is_required,
  required: field.is_required,
  order: field.order,
  sort_order: field.order,
  value: (field.value ?? field.raw_value ?? null) as FieldValue,
  score: typeof field.score === 'number' ? field.score : field.score ? Number(field.score) : null,
  notes: field.notes || null,
  is_flagged: field.is_flagged,
  photos: normalizePhotos(field.photos, field.name),
});

const buildSyntheticInspection = (examination: ManualExaminationDetail): Inspection => {
  const sections: InspectionSection[] = (examination.sections || []).map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description || undefined,
    order: section.order,
    fields: section.fields.map(normalizeField),
  }));

  return {
    id: examination.id,
    inspection_number: examination.inspection_number,
    status: (examination.status as Inspection['status']) || 'completed',
    scheduled_at: examination.created_at,
    started_at: examination.created_at || undefined,
    completed_at: examination.completed_at || undefined,
    cancelled_at: undefined,
    cancellation_reason: undefined,
    car: {
      id: examination.car.id || 0,
      name: `${examination.car.make || ''} ${examination.car.model || ''}`.trim() || 'N/A',
      brand: examination.car.make || '',
      model: examination.car.model || '',
      year: examination.car.year || undefined,
      color: examination.car.color || undefined,
      vin: examination.car.vin || undefined,
      license_plate: examination.car.plate_number || undefined,
      fuel_type: examination.car.fuel_type || undefined,
      transmission_type: examination.car.transmission || undefined,
    },
    sections,
    inspection_type: {
      id: examination.inspection_type?.id || 0,
      name: examination.inspection_type?.name || 'Manual Examination',
      description: examination.inspection_type?.description || undefined,
      price: 0,
      estimated_duration: 0,
      sections,
    },
    customer: {
      id: 0,
      name: 'Manual Examination',
    },
    actions: {
      can_start: false,
      can_complete: false,
      can_cancel: false,
      is_editable: false,
    },
    report_url: `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/inspector/manual-examinations/${examination.id}/download-pdf`,
    photos: normalizePhotos(examination.car.photos, 'Vehicle photo'),
    created_at: examination.created_at || new Date().toISOString(),
    updated_at: examination.completed_at || examination.created_at || new Date().toISOString(),
  };
};

/** Image component with built-in error handling and fallback */
const SafeImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt, className, onClick }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded ${className || ''}`}
        style={{ minHeight: '120px' }}
      >
        <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
        <span className="text-xs text-gray-500 font-medium px-2 text-center">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className || ''}`}
        onClick={onClick}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
      />
    </div>
  );
};

const ManualExaminationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examinationId = Number(id);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const currentLanguage = useSelector((state: RootState) => state.localization?.currentLanguage);
  const { t } = useTranslation();
  const { data: examination, isLoading, error } = useGetManualExaminationQuery(examinationId, {
    skip: !id || Number.isNaN(examinationId),
  });

  const syntheticInspection = useMemo(() => examination ? buildSyntheticInspection(examination) : null, [examination]);

  const allPhotos = useMemo(() => {
    if (!examination || !syntheticInspection) return [];

    const fieldPhotos = syntheticInspection.sections?.flatMap((section) =>
      section.fields.flatMap((field) => (field.photos || []).map((photo) => ({
        ...photo,
        fieldName: field.name,
      })))
    ) || [];

    const sectionPhotos = (examination.sections || []).flatMap((section) =>
      normalizePhotos(section.section_photos, section.name, section.name)
    );

    return [
      ...(syntheticInspection.photos || []).map((photo) => ({ ...photo, fieldName: 'Vehicle Photos' })),
      ...sectionPhotos,
      ...fieldPhotos,
    ];
  }, [examination, syntheticInspection]);

  const handlePhotoClick = (photo: InspectionPhoto) => {
    const index = allPhotos.findIndex((item) => item.id === photo.id && item.url === photo.url);
    if (index !== -1) {
      setSelectedPhotoIndex(index);
      setIsPhotoModalOpen(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (!syntheticInspection?.report_url) return;

    setIsDownloadingPdf(true);
    setDownloadError(null);
    try {
      const response = await fetch(syntheticInspection.report_url, {
        headers: {
          Accept: 'application/pdf, application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'App-Language': currentLanguage?.code || 'ar',
          'System-Key': import.meta.env.VITE_BACKEND_SYSTEM_KEY,
        },
      });

      if (!response.ok) {
        let message = `Download failed (HTTP ${response.status})`;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            message = errorData?.error?.message || errorData?.message || message;
          }
        } catch {
          // Keep the HTTP status message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `manual-examination-report-${syntheticInspection.inspection_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!id || Number.isNaN(examinationId)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">Invalid manual examination ID.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !examination || !syntheticInspection) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            Failed to load manual examination.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            onClick={() => navigate('/manual-examinations')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('inspections.actions.back')}</span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {examination.inspection_number}
            </h1>
            <span className={`inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full mt-1 ${getStatusColor(examination.status)}`}>
              {examination.status_display || examination.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{isDownloadingPdf ? 'Downloading...' : t('inspections.actions.downloadReport')}</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Vehicle Photos Section */}
          {allPhotos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Camera className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {t('inspections.fields.allPhotos')} ({allPhotos.length})
                    </h3>
                    <p className="text-sm text-slate-500">Vehicle, section, and field photos from this examination</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {allPhotos.map((photo, index) => {
                    const photoLabel = (photo as InspectionPhoto & { fieldName?: string }).fieldName || photo.caption || 'Photo';

                    return (
                      <button
                        key={`gallery-${photo.id}-${index}`}
                        type="button"
                        className="group relative text-left rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 aspect-square"
                        onClick={() => handlePhotoClick(photo)}
                      >
                        <SafeImage
                          src={photo.url || photo.thumbnail_url}
                          alt={photo.caption || 'Vehicle photo'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent">
                          <p className="text-white text-xs sm:text-sm font-semibold truncate">{photoLabel}</p>
                          <p className="text-slate-200 text-[11px] mt-0.5 truncate">{photo.caption || 'Tap to preview'}</p>
                        </div>
                        <div className="absolute inset-0 ring-0 ring-blue-300 group-hover:ring-2 transition-all rounded-2xl" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {allPhotos.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Camera className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No photos available</h3>
              <p className="text-sm text-slate-500 mt-1">This manual examination does not have any uploaded images yet.</p>
            </div>
          )}

          <InspectionFieldValues inspection={syntheticInspection} readOnly />

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Inspector Notes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Score</span>
                <p className="text-gray-900">{displayValue(examination.total_score)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Overall Condition</span>
                <p className="text-gray-900">{displayValue(examination.condition_display || examination.overall_condition)}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-700">Notes</span>
                <p className="text-gray-900 whitespace-pre-wrap">{displayValue(examination.inspector_notes)}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-700">Recommendations</span>
                <p className="text-gray-900 whitespace-pre-wrap">{displayValue(examination.recommendations)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('inspections.fields.carInformation')}</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">{t('inspections.fields.name')}:</span>
                <p className="text-gray-900 break-words">{syntheticInspection.car.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('inspections.fields.brandModel')}:</span>
                <p className="text-gray-900 break-words">{examination.car.make || 'N/A'} {examination.car.model || ''}</p>
              </div>
              {examination.car.year && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.year')}:</span>
                  <p className="text-gray-900">{examination.car.year}</p>
                </div>
              )}
              {examination.car.color && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.color')}:</span>
                  <p className="text-gray-900 break-words">{examination.car.color}</p>
                </div>
              )}
              {examination.car.vin && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.vin')}:</span>
                  <p className="text-gray-900 font-mono text-xs break-all">{examination.car.vin}</p>
                </div>
              )}
              {examination.car.plate_number && (
                <div>
                  <span className="font-medium text-gray-700">Plate Number:</span>
                  <p className="text-gray-900 break-words">{examination.car.plate_number}</p>
                </div>
              )}
              {examination.car.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-900 whitespace-pre-wrap">{examination.car.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              {t('inspections.details.inspectionDetails')}
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{t('inspections.details.timeline')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="break-words">Created: {formatDate(examination.created_at)}</span>
                  </div>
                  {examination.created_at && (
                    <div className="flex items-start gap-2">
                      <Play className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">Started: {formatDate(examination.created_at)}</span>
                    </div>
                  )}
                  {examination.completed_at && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">Completed: {formatDate(examination.completed_at)}</span>
                    </div>
                  )}
                  {(examination.status === 'cancelled' || examination.status === 'failed') && (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{examination.status_display || examination.status}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{t('inspections.details.inspectionType')}</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium break-words">{examination.inspection_type?.name || 'N/A'}</p>
                  {examination.inspection_type?.description && (
                    <p className="mt-1 break-words">{examination.inspection_type.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Additional Car Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Category', examination.car.category],
                ['Condition', examination.car.condition],
                ['Mileage', examination.car.milage],
                ['Transmission', examination.car.transmission],
                ['Fuel Type', examination.car.fuel_type],
                ['Price', examination.car.price],
                ['Location', examination.car.location],
                ['Country', examination.car.country],
                ['State', examination.car.state],
                ['City', examination.car.city],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span className="font-medium text-gray-700">{label}:</span>
                  <p className="text-gray-900 break-words">{displayValue(value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {allPhotos.length > 0 && (
        <PhotoModal
          photos={allPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          readOnly
        />
      )}
    </div>
  );
};

export default ManualExaminationDetailPage;

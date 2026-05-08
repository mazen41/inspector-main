import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Calendar,
  User,
  Car,
  Camera,
  Play,
  CheckCircle,
  XCircle,
  Download,
  AlertCircle,
  Edit,
} from 'lucide-react';
import {
  useGetInspectionQuery,
  useStartInspectionMutation,
  useCompleteInspectionMutation,
  useCancelInspectionMutation,
} from '../../store/api/inspectionApi';
import { useTranslation } from '../../hooks/useTranslation';
import InspectionFieldValues from './InspectionFieldValues';
import InspectionCompletionModal, { type InspectionCompletionData } from './InspectionCompletionModal';
import PhotoPreviewGrid from './PhotoPreviewGrid';
import PhotoModal from './PhotoModal';
import type { InspectionStatus, InspectionPhoto } from '../../types';
import type { RootState } from '../../store';

interface InspectionDetailProps {
  inspectionId: number;
  onBack?: () => void;
}

const InspectionDetail: React.FC<InspectionDetailProps> = ({
  inspectionId,
  onBack,
}) => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const currentLanguage = useSelector((state: RootState) => state.localization?.currentLanguage);
  const { t } = useTranslation();

  const { data: inspection, isLoading, error } = useGetInspectionQuery(inspectionId);
  const [startInspection, { isLoading: isStarting }] = useStartInspectionMutation();
  const [completeInspection, { isLoading: isCompleting }] = useCompleteInspectionMutation();
  const [cancelInspection, { isLoading: isCancelling }] = useCancelInspectionMutation();

  const getStatusColor = (status: InspectionStatus | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartInspection = async () => {
    try {
      await startInspection(inspectionId).unwrap();
    } catch (error) {
      console.error('Failed to start inspection:', error);
    }
  };

  const handleCompleteInspection = () => {
    setShowCompletionModal(true);
  };

  const handleCompletionSubmit = async (completionData: InspectionCompletionData) => {
    try {
      await completeInspection({
        id: inspectionId,
        completion_data: completionData,
      }).unwrap();
      setShowCompletionModal(false);
    } catch (error) {
      console.error('Failed to complete inspection:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleCancelInspection = async () => {
    if (!cancelReason.trim()) return;
    
    try {
      await cancelInspection({ id: inspectionId, reason: cancelReason }).unwrap();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel inspection:', error);
    }
  };

  // Collect all photos from all fields for the photo gallery
  const getAllFieldPhotos = (): Array<InspectionPhoto & { fieldName: string }> => {
    const allPhotos: Array<InspectionPhoto & { fieldName: string }> = [];
    
    if (inspection?.sections) {
      inspection.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.photos && field.photos.length > 0) {
            field.photos.forEach(photo => {
              allPhotos.push({
                ...photo,
                fieldName: field.name
              });
            });
          }
        });
      });
    }
    
    // Sort by upload date (newest first)
    return allPhotos.sort((a, b) => 
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
  };

  const allFieldPhotos = inspection ? getAllFieldPhotos() : [];

  const handlePhotoClick = (photo: InspectionPhoto) => {
    const index = allFieldPhotos.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      setSelectedPhotoIndex(index);
      setIsPhotoModalOpen(true);
    }
  };

  const handlePhotoDelete = () => {
    // In read-only mode, we don't allow deletion
    console.log('Photo deletion not available in read-only mode');
  };

  const getReportDownloadUrl = () => {
    if (inspection?.report_url) return inspection.report_url;
    return `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/inspector/inspections/${inspectionId}/download-pdf`;
  };

  const handleDownloadReport = async () => {
    if (!inspection) return;

    setIsDownloadingReport(true);
    setDownloadError(null);
    try {
      const response = await fetch(getReportDownloadUrl(), {
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
          // Keep HTTP status message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `inspection-report-${inspection.inspection_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingReport(false);
    }
  };


  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">
              {t('inspections.details.failedToLoad')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log the inspection data to see the actual structure
  console.log('Inspection data:', inspection);

  const canStart = inspection.actions.can_start;
  const canComplete = inspection.actions.can_complete;
  const canCancel = inspection.actions.can_cancel;
  const isEditable = inspection.actions.is_editable;

  const handleEditInspection = () => {
    navigate(`/inspections/${inspectionId}/edit`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('inspections.actions.back')}</span>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {inspection.inspection_number}
            </h1>
            <span
              className={`inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full mt-1 ${getStatusColor(
                inspection.status
              )}`}
            >
              {inspection.status ? inspection.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isDownloadingReport}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{isDownloadingReport ? 'Downloading...' : t('inspections.actions.downloadReport')}</span>
            <span className="sm:hidden">Report</span>
          </button>

          {isEditable && (
            <button
              onClick={handleEditInspection}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">{t('inspections.actions.editInspection')}</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}

          {canStart && (
            <button
              onClick={handleStartInspection}
              disabled={isStarting}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">{isStarting ? t('inspections.actions.starting') : t('inspections.actions.startInspection')}</span>
              <span className="sm:hidden">{isStarting ? 'Starting' : 'Start'}</span>
            </button>
          )}

          {canComplete && (
            <button
              onClick={handleCompleteInspection}
              disabled={isCompleting}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{isCompleting ? t('inspections.actions.completing') : t('inspections.actions.completeInspection')}</span>
              <span className="sm:hidden">{isCompleting ? 'Completing' : 'Complete'}</span>
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('inspections.actions.cancelInspection')}</span>
              <span className="sm:hidden">Cancel</span>
            </button>
          )}
        </div>
      </div>

      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Photo Gallery Section */}
          {allFieldPhotos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {t('inspections.fields.allPhotos')} ({allFieldPhotos.length})
                </h3>
              </div>
              
              <PhotoPreviewGrid
                photos={allFieldPhotos}
                onPhotoClick={handlePhotoClick}
                onPhotoDelete={handlePhotoDelete}
                readOnly={true}
              />
            </div>
          )}

          {/* Inspection Field Values */}
          <InspectionFieldValues 
            inspection={inspection} 
            readOnly={true}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Car Information */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('inspections.fields.carInformation')}</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">{t('inspections.fields.name')}:</span>
                <p className="text-gray-900 break-words">{inspection.car?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('inspections.fields.brandModel')}:</span>
                <p className="text-gray-900 break-words">{inspection.car?.brand || 'N/A'} {inspection.car?.model || ''}</p>
              </div>
              {inspection.car.year && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.year')}:</span>
                  <p className="text-gray-900">{inspection.car.year}</p>
                </div>
              )}
              {inspection.car.color && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.color')}:</span>
                  <p className="text-gray-900 break-words">{inspection.car.color}</p>
                </div>
              )}
              {inspection.car.vin && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.vin')}:</span>
                  <p className="text-gray-900 font-mono text-xs break-all">{inspection.car.vin}</p>
                </div>
              )}
            </div>
          </div>
            {/* Inspection Details */}
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
                    <span className="break-words">{t('inspections.details.scheduled')}: {formatDate(inspection.scheduled_at)}</span>
                  </div>
                  {inspection.started_at && (
                    <div className="flex items-start gap-2">
                      <Play className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{t('inspections.details.started')}: {formatDate(inspection.started_at)}</span>
                    </div>
                  )}
                  {inspection.completed_at && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{t('inspections.details.completed')}: {formatDate(inspection.completed_at)}</span>
                    </div>
                  )}
                  {inspection.cancelled_at && (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{t('inspections.details.cancelled')}: {formatDate(inspection.cancelled_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{t('inspections.details.inspectionType')}</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium break-words">{inspection.inspection_type?.name || 'N/A'}</p>
                  {inspection.inspection_type?.description && (
                    <p className="mt-1 break-words">{inspection.inspection_type.description}</p>
                  )}
                  <p className="mt-1">
                    {t('inspections.details.estimatedDuration')}: {inspection.inspection_type?.estimated_duration || 0} {t('inspections.details.hours')}
                  </p>
                  <p>{t('inspections.details.price')}: ${inspection.inspection_type?.price || 0}</p>
                </div>
              </div>
            </div>

            {inspection.cancellation_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-1 text-sm">{t('inspections.details.cancellationReason')}</h4>
                <p className="text-red-700 text-sm break-words">{inspection.cancellation_reason}</p>
              </div>
            )}
          </div>
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('inspections.fields.customerInformation')}</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">{t('inspections.fields.name')}:</span>
                <p className="text-gray-900 break-words">{inspection.customer?.name || 'N/A'}</p>
              </div>
              {inspection.customer.email && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.email')}:</span>
                  <p className="text-gray-900 break-all">{inspection.customer.email}</p>
                </div>
              )}
              {inspection.customer.phone && (
                <div>
                  <span className="font-medium text-gray-700">{t('inspections.fields.phone')}:</span>
                  <p className="text-gray-900 break-all">{inspection.customer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          {inspection.photos && inspection.photos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('inspections.fields.photos')}</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inspection.photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.caption || 'Inspection photo'}
                      className="w-full h-16 sm:h-20 object-cover rounded-lg"
                    />
                    {photo.caption && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      <InspectionCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onSubmit={handleCompletionSubmit}
        isSubmitting={isCompleting}
        inspectionNumber={inspection.inspection_number}
      />

      {/* Photo Gallery Modal */}
      {allFieldPhotos.length > 0 && (
        <PhotoModal
          photos={allFieldPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          readOnly={true}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              {t('inspections.modal.cancelInspection')}
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {t('inspections.modal.cancelReason')}
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('inspections.modal.cancelReasonPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={3}
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                {t('inspections.actions.cancel')}
              </button>
              <button
                onClick={handleCancelInspection}
                disabled={!cancelReason.trim() || isCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {isCancelling ? t('inspections.actions.cancelling') : t('inspections.actions.confirmCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetail;
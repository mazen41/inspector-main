import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Download, Eye, FilePlus2, Search, Square, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useGetManualExaminationsQuery } from '../store/api/manualExaminationApi';
import type { RootState } from '../store';
import type { ManualExaminationFilters } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const ManualExaminationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ManualExaminationFilters>({ page: 1, per_page: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const currentLanguage = useSelector((state: RootState) => state.localization?.currentLanguage);
  const { data, isLoading, error } = useGetManualExaminationsQuery(filters);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchTerm || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((current) => ({ ...current, page }));
  };

  const handleDownloadPdf = async (event: React.MouseEvent, examinationId: number, inspectionNumber: string) => {
    event.stopPropagation();
    setDownloadingPdfId(examinationId);
    setDownloadError(null);
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/inspector/manual-examinations/${examinationId}/download`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf, application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'App-Language': currentLanguage?.code || 'ar',
          'System-Key': import.meta.env.VITE_BACKEND_SYSTEM_KEY,
        },
      });

      if (!response.ok) {
        let errorMessage = `${t('inspections.manual.downloadFailedHttp')} (HTTP ${response.status})`;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
            if (errorMessage === 'Request not found!') {
              errorMessage = t('inspections.manual.authConfigError');
            }
          }
        } catch {
          // ignore JSON parse errors; use the default message
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error(t('inspections.manual.invalidPdfResponse'));
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `manual-examination-report-${inspectionNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('inspections.manual.downloadFailed');
      setDownloadError(message);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-600">
          {t('inspections.manual.failedToLoad')}
        </div>
      </div>
    );
  }

  const examinations = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-full overflow-hidden">
      {downloadError && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{downloadError}</span>
          <button
            onClick={() => setDownloadError(null)}
            className="ml-auto flex-shrink-0 font-medium hover:text-red-900"
            aria-label={t('common.dismiss')}
          >
            ✕
          </button>
        </div>
      )}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('inspections.manual.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('inspections.manual.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => navigate('/manual-examinations/create')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FilePlus2 className="h-4 w-4" />
            {t('inspections.manual.createNew')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('inspections.manual.searchPlaceholder')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </form>
        </div>

        <div className="divide-y divide-gray-200">
          {examinations.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">{t('inspections.manual.empty')}</p>
            </div>
          ) : (
            examinations.map((examination) => (
              <div key={examination.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(examination.status)}
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {examination.inspection_number}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full self-start ${getStatusColor(examination.status)}`}>
                        {examination.status_display || examination.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{t('inspections.manual.car')}:</span>{' '}
                        {examination.car.make || 'N/A'} {examination.car.model || ''} {examination.car.year ? `(${examination.car.year})` : ''}
                      </div>
                      <div>
                        <span className="font-medium">{t('inspections.manual.plate')}:</span> {examination.car.plate_number || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">{t('inspections.manual.created')}:</span> {formatDate(examination.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <button
                      onClick={(event) => handleDownloadPdf(event, examination.id, examination.inspection_number)}
                      disabled={downloadingPdfId === examination.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-green-700 hover:bg-green-50 disabled:opacity-50 rounded-lg transition-colors text-sm w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingPdfId === examination.id ? t('inspections.manual.downloading') : t('inspections.manual.downloadPdf')}
                    </button>
                    <button
                      onClick={() => navigate(`/manual-examinations/${examination.id}`)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4" />
                      {t('inspections.manual.view')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {meta && meta.total > meta.per_page && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                {t('inspections.manual.showing')} {((meta.current_page - 1) * meta.per_page) + 1} {t('inspections.manual.to')} {Math.min(meta.current_page * meta.per_page, meta.total)} {t('inspections.manual.of')} {meta.total} {t('inspections.manual.results')}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('inspections.manual.previous')}
                </button>
                <span className="px-3 py-2 text-sm whitespace-nowrap">
                  {meta.current_page}/{meta.last_page}
                </span>
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page >= meta.last_page}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('inspections.manual.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualExaminationsPage;

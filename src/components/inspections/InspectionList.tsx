import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  Square,
} from 'lucide-react';
import { useGetInspectionsQuery } from '../../store/api/inspectionApi';
import { useTranslation } from '../../hooks/useTranslation';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { InspectionFilters, InspectionStatus } from '../../types';
import { buildInspectorApiUrl } from '../../utils/apiUrl';

interface InspectionListProps {
  onInspectionSelect?: (inspectionId: number) => void;
}

const InspectionList: React.FC<InspectionListProps> = ({ onInspectionSelect }) => {
  const [filters, setFilters] = useState<InspectionFilters>({
    page: 1,
    per_page: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const currentLanguage = useSelector((state: RootState) => state.localization?.currentLanguage);

  const { data, isLoading, error } = useGetInspectionsQuery(filters);
  const { t } = useTranslation();


  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case 'in_progress':
        return <Play className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Square className="h-4 w-4 text-gray-400" />;
    }
  };
  const getStatusLabel = (status: InspectionStatus) => {
    switch (status){
      case "cancelled":
        return t('inspections.status.cancel');
      case "completed":
        return t('inspections.status.completed');
      case "in_progress": 
      return t('inspections.status.inProgress');
      case "scheduled":
        return t('inspections.status.scheduled');
        default:
        return t('inspections.status.unknown');
        
    }
  }

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
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



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof InspectionFilters, value: InspectionFilters[keyof InspectionFilters]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDownloadPdf = async (event: React.MouseEvent, inspectionId: number, inspectionNumber: string) => {
    event.stopPropagation();
    setDownloadingPdfId(inspectionId);
    setDownloadError(null);
    try {
      const response = await fetch(buildInspectorApiUrl(`/inspections/${inspectionId}/download-pdf`), {
        method: 'GET',
        credentials: 'omit',
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

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Server did not return a PDF. Please try again later.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspection-report-${inspectionNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          {t('inspections.list.failedToLoad')}
        </div>
      </div>
    );
  }

  const inspections = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('inspections.list.title')}</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('inspections.list.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors flex-shrink-0 text-sm ${showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('inspections.list.filters')}</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t('inspections.filters.status')}
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">{t('inspections.filters.allStatuses')}</option>
                  <option value="in_progress">{t('inspections.status.inProgress')}</option>
                  <option value="completed">{t('inspections.status.completed')}</option>
                  <option value="cancelled">{t('inspections.status.cancelled')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t('inspections.filters.fromDate')}
                </label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t('inspections.filters.toDate')}
                </label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {downloadError && (
        <div className="mx-4 sm:mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {downloadError}
        </div>
      )}

      {/* Inspections List */}
      <div className="divide-y divide-gray-200">
        {inspections.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">{t('inspections.list.noInspections')}</p>
          </div>
        ) : (
          inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onInspectionSelect?.(inspection.id)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(inspection.status)}
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {inspection.inspection_number}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full self-start ${getStatusColor(
                        inspection.status
                      )}`}
                    >
                      {getStatusLabel(inspection.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="truncate">
                      <span className="font-medium">{t('inspections.fields.car')}:</span>{' '}
                      <span className="break-words">{inspection.car.name}</span>
                      <span>{inspection.car.vin}</span>
                    </div>
                    <div className="truncate">
                      <span className="font-medium">{t('inspections.fields.customer')}:</span>{' '}
                      <span className="break-words">{inspection.customer.name}</span>
                    </div>
                    <div className="truncate">
                      <span className="font-medium">{t('inspections.fields.type')}:</span>{' '}
                      <span className="break-words">{inspection.inspection_type.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <button
                    onClick={(event) => handleDownloadPdf(event, inspection.id, inspection.inspection_number)}
                    disabled={downloadingPdfId === inspection.id}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-green-700 hover:bg-green-50 disabled:opacity-50 rounded-lg transition-colors text-sm w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {downloadingPdfId === inspection.id ? 'Downloading...' : 'Download PDF'}
                    </span>
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm w-full sm:w-auto">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('inspections.list.view')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total > meta.per_page && (
        <div className="p-4 sm:p-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              <span className="hidden sm:inline">
                {t('inspections.list.showing')} {((meta.current_page - 1) * meta.per_page) + 1} {t('inspections.list.to')}{' '}
                {Math.min(meta.current_page * meta.per_page, meta.total)} {t('inspections.list.of')}{' '}
                {meta.total} {t('inspections.list.results')}
              </span>
              <span className="sm:hidden">
                {((meta.current_page - 1) * meta.per_page) + 1}-{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <span className="hidden sm:inline">{t('inspections.list.previous')}</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <span className="px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <span className="hidden sm:inline">
                  {t('inspections.list.page')} {meta.current_page} {t('inspections.list.of')} {Math.ceil(meta.total / meta.per_page)}
                </span>
                <span className="sm:hidden">
                  {meta.current_page}/{Math.ceil(meta.total / meta.per_page)}
                </span>
              </span>

              <button
                onClick={() => handlePageChange(meta.current_page + 1)}
                disabled={meta.current_page >= Math.ceil(meta.total / meta.per_page)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <span className="hidden sm:inline">{t('inspections.list.next')}</span>
                <span className="sm:hidden">Next</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionList;

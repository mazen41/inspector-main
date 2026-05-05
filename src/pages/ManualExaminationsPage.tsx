import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, FilePlus2, Search, Square, CheckCircle, XCircle, Play } from 'lucide-react';
import { useGetManualExaminationsQuery } from '../store/api/manualExaminationApi';
import type { ManualExaminationFilters } from '../types';

const ManualExaminationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ManualExaminationFilters>({ page: 1, per_page: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useGetManualExaminationsQuery(filters);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchTerm || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((current) => ({ ...current, page }));
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
          Failed to load manual examinations.
        </div>
      </div>
    );
  }

  const examinations = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-full overflow-hidden">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manual Examinations</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and review manual car examinations.</p>
        </div>
        <button
          onClick={() => navigate('/manual-examinations/create')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <FilePlus2 className="h-4 w-4" />
          Create New
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by inspection number, VIN, plate, make, or model"
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
              <p className="text-sm sm:text-base">No manual examinations found.</p>
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
                        <span className="font-medium">Car:</span>{' '}
                        {examination.car.make || 'N/A'} {examination.car.model || ''} {examination.car.year ? `(${examination.car.year})` : ''}
                      </div>
                      <div>
                        <span className="font-medium">Plate:</span> {examination.car.plate_number || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(examination.created_at)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/manual-examinations/${examination.id}`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {meta && meta.total > meta.per_page && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing {((meta.current_page - 1) * meta.per_page) + 1} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} results
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm whitespace-nowrap">
                  {meta.current_page}/{meta.last_page}
                </span>
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page >= meta.last_page}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
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

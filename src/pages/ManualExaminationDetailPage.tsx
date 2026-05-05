import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Car, ClipboardList } from 'lucide-react';
import { useGetManualExaminationQuery } from '../store/api/manualExaminationApi';

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const ManualExaminationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examinationId = Number(id);
  const { data: examination, isLoading, error } = useGetManualExaminationQuery(examinationId, {
    skip: !id || Number.isNaN(examinationId),
  });

  if (!id || Number.isNaN(examinationId)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">Invalid manual examination ID.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-48 bg-white rounded-lg shadow" />
          <div className="h-64 bg-white rounded-lg shadow" />
        </div>
      </div>
    );
  }

  if (error || !examination) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/manual-examinations')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {examination.inspection_number}
            </h1>
            <span className="inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full mt-1 bg-green-100 text-green-800">
              {examination.status_display || examination.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Examination Fields</h2>
            </div>
            <div className="space-y-6">
              {(examination.sections || []).map((section) => (
                <div key={section.id}>
                  <h3 className="font-medium text-gray-900 pb-2 border-b border-gray-200">{section.name}</h3>
                  {section.description && <p className="text-sm text-gray-500 mt-2">{section.description}</p>}
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="py-2 pr-4">Field</th>
                          <th className="py-2 pr-4">Value</th>
                          <th className="py-2 pr-4">Score</th>
                          <th className="py-2 pr-4">Notes</th>
                          <th className="py-2">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {section.fields.map((field) => (
                          <tr key={field.id}>
                            <td className="py-3 pr-4 font-medium text-gray-900">{field.name}</td>
                            <td className="py-3 pr-4 text-gray-700">{displayValue(field.value ?? field.raw_value)}</td>
                            <td className="py-3 pr-4 text-gray-700">{displayValue(field.score)}</td>
                            <td className="py-3 pr-4 text-gray-700">{displayValue(field.notes)}</td>
                            <td className="py-3 text-gray-700">
                              {field.is_flagged ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                                  {field.flag_reason || 'Flagged'}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              <h2 className="font-semibold text-gray-900">Car Information</h2>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Make', examination.car.make],
                ['Model', examination.car.model],
                ['Year', examination.car.year],
                ['VIN', examination.car.vin],
                ['Plate Number', examination.car.plate_number],
                ['Category', examination.car.category],
                ['Color', examination.car.color],
                ['Condition', examination.car.condition],
                ['Mileage', examination.car.milage],
                ['Transmission', examination.car.transmission],
                ['Fuel Type', examination.car.fuel_type],
                ['Price', examination.car.price],
                ['Location', examination.car.location],
                ['Country', examination.car.country],
                ['State', examination.car.state],
                ['City', examination.car.city],
                ['Main Photo ID', examination.car.main_photo],
                ['Photos', examination.car.photos],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span className="font-medium text-gray-700">{label}:</span>
                  <p className="text-gray-900 break-words">{displayValue(value)}</p>
                </div>
              ))}
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-900 whitespace-pre-wrap">{displayValue(examination.car.description)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Extras</h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Features</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(examination.car.features || []).length > 0 ? (
                    examination.car.features?.map((feature) => (
                      <span key={feature.id} className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                        {feature.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Custom Fields</span>
                <div className="mt-2 space-y-2">
                  {(examination.car.custom_fields || []).length > 0 ? (
                    examination.car.custom_fields?.map((field) => (
                      <div key={field.id} className="flex justify-between gap-3">
                        <span className="text-gray-600">{field.name}</span>
                        <span className="text-gray-900">{displayValue(field.value)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualExaminationDetailPage;

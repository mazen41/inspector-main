import React from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Car, CheckCircle, Calendar } from 'lucide-react';

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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

interface PublicExamData {
  id: number;
  inspection_number: string;
  status: string;
  status_display?: string;
  inspector_notes?: string;
  recommendations?: string;
  total_score?: number;
  overall_condition?: string;
  condition_display?: string;
  created_at?: string;
  completed_at?: string;
  car: {
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    vin?: string;
    plate_number?: string;
    milage?: number;
    fuel_type?: string;
    transmission?: string;
    price?: string;
    location?: string;
    description?: string;
    category?: string;
    condition?: string;
  };
  inspection_type?: {
    id: number;
    name: string;
    description?: string;
  };
  sections?: Array<{
    id: number;
    name: string;
    description?: string;
    order: number;
    fields: Array<{
      id: number;
      name: string;
      description?: string;
      type: string;
      value?: string | number | boolean | null;
      formatted_value?: string;
      score?: number | null;
      notes?: string | null;
      is_flagged?: boolean;
      photos?: unknown;
    }>;
  }>;
  photos?: unknown;
}

const PublicManualExaminationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [examination, setExamination] = React.useState<PublicExamData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
        const apiVersion = String(import.meta.env.VITE_API_VERSION || 'v2').replace(/^\/+|\/+$/g, '');
        const response = await fetch(`${apiBaseUrl}/${apiVersion}/public/manual-examinations/${id}`, {
          headers: {
            'Accept': 'application/json',
            'System-Key': import.meta.env.VITE_BACKEND_SYSTEM_KEY || '',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load examination (HTTP ${response.status})`);
        }
        
        const json = await response.json();
        if (json.data) setExamination(json.data as PublicExamData);
        else if (json.examination) setExamination(json.examination as PublicExamData);
        else setExamination(json as unknown as PublicExamData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load examination');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">Invalid examination ID.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="animate-pulse w-full max-w-4xl">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !examination) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            {error || 'Failed to load examination.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Vehicle Examination Report
              </h1>
              <p className="text-gray-500 mt-1">
                #{examination.inspection_number}
              </p>
            </div>
            <div className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
              Completed
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Car Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Vehicle Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ['Make', examination.car.make],
                    ['Model', examination.car.model],
                    ['Year', examination.car.year],
                    ['Color', examination.car.color],
                    ['VIN', examination.car.vin],
                    ['Plate Number', examination.car.plate_number],
                    ['Mileage', examination.car.milage],
                    ['Fuel Type', examination.car.fuel_type],
                    ['Transmission', examination.car.transmission],
                    ['Category', examination.car.category],
                    ['Condition', examination.car.condition],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-sm font-medium text-gray-500">{label}</span>
                      <p className="text-gray-900 mt-0.5">{displayValue(value)}</p>
                    </div>
                  ))}
                </div>
                {examination.car.description && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-sm font-medium text-gray-500">Description</span>
                    <p className="text-gray-900 mt-0.5 whitespace-pre-wrap">{examination.car.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Fields/Sections */}
            {examination.sections && examination.sections.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-lg font-semibold text-slate-900">Inspection Results</h3>
                </div>
                <div className="p-6 space-y-6">
                  {examination.sections.map((section) => (
                    <div key={section.id}>
                      <h4 className="font-semibold text-gray-900 mb-3">{section.name}</h4>
                      {section.description && (
                        <p className="text-sm text-gray-500 mb-3">{section.description}</p>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-500">Field</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-500">Value</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-500">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.fields.map((field) => (
                              <tr key={field.id} className="border-b border-slate-100">
                                <td className="py-2 px-3 font-medium text-gray-900">{field.name}</td>
                                <td className="py-2 px-3 text-gray-700">
                                  {field.formatted_value || displayValue(field.value)}
                                </td>
                                <td className="py-2 px-3 text-gray-500">{field.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspector Notes & Recommendations */}
            {(examination.inspector_notes || examination.recommendations) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-lg font-semibold text-slate-900">Inspector Notes</h3>
                </div>
                <div className="p-6 space-y-4">
                  {examination.inspector_notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Notes</span>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{examination.inspector_notes}</p>
                    </div>
                  )}
                  {examination.recommendations && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Recommendations</span>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{examination.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-semibold text-slate-900">Summary</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Score</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {examination.total_score ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Condition</span>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {examination.condition_display || examination.overall_condition || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Inspection Type</span>
                  <p className="text-gray-900 mt-1">{examination.inspection_type?.name || 'Manual Examination'}</p>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-semibold text-slate-900">Timeline</h3>
              </div>
              <div className="p-6 space-y-3">
                {examination.created_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-500">{formatDate(examination.created_at)}</p>
                    </div>
                  </div>
                )}
                {examination.completed_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Completed</p>
                      <p className="text-xs text-gray-500">{formatDate(examination.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800">
                This is a public view of the vehicle examination report. 
                The information provided is for reference purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicManualExaminationDetailPage;

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, ChevronRight, Save } from 'lucide-react';
import {
  useCreateManualExaminationMutation,
  useGetCarBrandsQuery,
  useGetCarCategoriesQuery,
  useGetCarCustomFieldsQuery,
  useGetCarFeaturesQuery,
  useGetCarInspectionTypesQuery,
  useGetCarModelsByBrandQuery,
  useGetManualCitiesByStateQuery,
  useGetManualCountriesQuery,
  useGetManualStatesByCountryQuery,
} from '../store/api/manualExaminationApi';
import type {
  CarLookupItem,
  FieldType,
  ManualExaminationCarPayload,
  ManualExaminationCreatePayload,
  ManualExaminationFieldValuePayload,
} from '../types';

type CarFormState = {
  vin: string;
  plate_number: string;
  description: string;
  brand_id: string;
  model_id: string;
  category_id: string;
  color_id: string;
  condition: 'new' | 'used' | '';
  milage: string;
  manufacture_year: string;
  transmission: string;
  fuel_type: string;
  location: string;
  price: string;
  country_id: string;
  state_id: string;
  city_id: string;
  main_photo: string;
  photos: string;
  features: number[];
};

type FieldTemplate = {
  id: number;
  name: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  section: string;
};

const initialCarForm: CarFormState = {
  vin: '',
  plate_number: '',
  description: '',
  brand_id: '',
  model_id: '',
  category_id: '',
  color_id: '',
  condition: '',
  milage: '',
  manufacture_year: '',
  transmission: 'automatic',
  fuel_type: 'petrol',
  location: '',
  price: '',
  country_id: '',
  state_id: '',
  city_id: '',
  main_photo: '',
  photos: '',
  features: [],
};

const fieldTemplatesByType: Record<string, FieldTemplate[]> = {
  'seller-form': [
    { id: 1, section: 'Vehicle Information', name: 'Vehicle Identification Number (VIN)', type: 'text', required: true },
    { id: 2, section: 'Vehicle Information', name: 'Odometer Reading', type: 'number', required: true },
    { id: 3, section: 'Vehicle Information', name: 'Number of Previous Owners', type: 'select', required: true, options: ['1', '2', '3', '4', '5+'] },
    { id: 4, section: 'Vehicle Information', name: 'Accident History', type: 'boolean', required: true },
    { id: 5, section: 'Vehicle Information', name: 'Accident Details', type: 'textarea', required: false },
    { id: 6, section: 'Condition Assessment', name: 'Overall Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'] },
    { id: 7, section: 'Condition Assessment', name: 'Regular Maintenance', type: 'boolean', required: true },
    { id: 8, section: 'Condition Assessment', name: 'Service Records Available', type: 'boolean', required: true },
    { id: 9, section: 'Condition Assessment', name: 'Known Issues', type: 'textarea', required: false },
    { id: 10, section: 'Documentation', name: 'Vehicle Registration', type: 'boolean', required: true },
    { id: 11, section: 'Documentation', name: 'Safety Certificate', type: 'boolean', required: true },
    { id: 12, section: 'Documentation', name: 'Emission Test', type: 'boolean', required: true },
    { id: 13, section: 'Documentation', name: 'Warranty Status', type: 'select', required: true, options: ['None', 'Manufacturer Warranty', 'Extended Warranty', 'Third Party Warranty'] },
  ],
  'buyer-basic-test': [
    { id: 14, section: 'Exterior Inspection', name: 'Paint Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Attention'] },
    { id: 15, section: 'Exterior Inspection', name: 'Body Damage', type: 'checkbox', required: true, options: ['Scratches', 'Dents', 'Rust', 'Collision Damage', 'None'] },
    { id: 16, section: 'Exterior Inspection', name: 'Tire Condition', type: 'select', required: true, options: ['New', 'Good', 'Fair', 'Worn', 'Needs Replacement'] },
    { id: 17, section: 'Exterior Inspection', name: 'Windshield Condition', type: 'select', required: true, options: ['Perfect', 'Minor Chips', 'Cracked', 'Needs Replacement'] },
    { id: 18, section: 'Interior Inspection', name: 'Seat Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Worn', 'Damaged'] },
    { id: 19, section: 'Interior Inspection', name: 'Dashboard Condition', type: 'select', required: true, options: ['Perfect', 'Good', 'Faded', 'Cracked', 'Damaged'] },
    { id: 20, section: 'Interior Inspection', name: 'Electronics Working', type: 'checkbox', required: true, options: ['Radio', 'A/C', 'Heater', 'Power Windows', 'Power Locks', 'GPS'] },
    { id: 21, section: 'Interior Inspection', name: 'Interior Cleanliness', type: 'select', required: true, options: ['Very Clean', 'Clean', 'Fair', 'Dirty', 'Very Dirty'] },
    { id: 22, section: 'Engine Bay', name: 'Engine Starts Easily', type: 'boolean', required: true },
    { id: 23, section: 'Engine Bay', name: 'Engine Idle Quality', type: 'select', required: true, options: ['Smooth', 'Slightly Rough', 'Rough', 'Very Rough'] },
    { id: 24, section: 'Engine Bay', name: 'Fluid Levels', type: 'checkbox', required: true, options: ['Oil OK', 'Coolant OK', 'Brake Fluid OK', 'Power Steering OK'] },
    { id: 25, section: 'Engine Bay', name: 'Visible Leaks', type: 'boolean', required: true },
    { id: 26, section: 'Test Drive', name: 'Transmission Performance', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Problematic'] },
    { id: 27, section: 'Test Drive', name: 'Braking Performance', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Unsafe'] },
    { id: 28, section: 'Test Drive', name: 'Steering Response', type: 'select', required: true, options: ['Responsive', 'Good', 'Fair', 'Loose', 'Problematic'] },
    { id: 29, section: 'Test Drive', name: 'Unusual Noises', type: 'textarea', required: false },
  ],
  'buyer-advanced-test': [
    { id: 30, section: 'Exterior Inspection', name: 'Paint Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Attention'] },
    { id: 31, section: 'Exterior Inspection', name: 'Body Damage', type: 'checkbox', required: true, options: ['Scratches', 'Dents', 'Rust', 'Collision Damage', 'None'] },
    { id: 32, section: 'Exterior Inspection', name: 'Tire Condition', type: 'select', required: true, options: ['New', 'Good', 'Fair', 'Worn', 'Needs Replacement'] },
    { id: 33, section: 'Exterior Inspection', name: 'Windshield Condition', type: 'select', required: true, options: ['Perfect', 'Minor Chips', 'Cracked', 'Needs Replacement'] },
    { id: 34, section: 'Interior Inspection', name: 'Seat Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Worn', 'Damaged'] },
    { id: 35, section: 'Interior Inspection', name: 'Dashboard Condition', type: 'select', required: true, options: ['Perfect', 'Good', 'Faded', 'Cracked', 'Damaged'] },
    { id: 36, section: 'Interior Inspection', name: 'Electronics Working', type: 'checkbox', required: true, options: ['Radio', 'A/C', 'Heater', 'Power Windows', 'Power Locks', 'GPS'] },
    { id: 37, section: 'Interior Inspection', name: 'Interior Cleanliness', type: 'select', required: true, options: ['Very Clean', 'Clean', 'Fair', 'Dirty', 'Very Dirty'] },
    { id: 38, section: 'Engine Bay', name: 'Engine Starts Easily', type: 'boolean', required: true },
    { id: 39, section: 'Engine Bay', name: 'Engine Idle Quality', type: 'select', required: true, options: ['Smooth', 'Slightly Rough', 'Rough', 'Very Rough'] },
    { id: 40, section: 'Engine Bay', name: 'Fluid Levels', type: 'checkbox', required: true, options: ['Oil OK', 'Coolant OK', 'Brake Fluid OK', 'Power Steering OK'] },
    { id: 41, section: 'Engine Bay', name: 'Visible Leaks', type: 'boolean', required: true },
    { id: 42, section: 'Test Drive', name: 'Transmission Performance', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Problematic'] },
    { id: 43, section: 'Test Drive', name: 'Braking Performance', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Unsafe'] },
    { id: 44, section: 'Test Drive', name: 'Steering Response', type: 'select', required: true, options: ['Responsive', 'Good', 'Fair', 'Loose', 'Problematic'] },
    { id: 45, section: 'Test Drive', name: 'Unusual Noises', type: 'textarea', required: false },
    { id: 46, section: 'Mechanical Systems', name: 'Engine Compression Test', type: 'text', required: false },
    { id: 47, section: 'Mechanical Systems', name: 'Suspension Components', type: 'select', required: true, options: ['Excellent', 'Good', 'Worn', 'Needs Attention', 'Needs Replacement'] },
    { id: 48, section: 'Mechanical Systems', name: 'Exhaust System', type: 'select', required: true, options: ['Perfect', 'Good', 'Minor Issues', 'Needs Repair', 'Needs Replacement'] },
    { id: 49, section: 'Mechanical Systems', name: 'Timing Belt/Chain', type: 'select', required: true, options: ['Recently Replaced', 'Good Condition', 'Needs Attention', 'Needs Replacement', 'Unknown'] },
    { id: 50, section: 'Electrical Systems', name: 'Battery Condition', type: 'select', required: true, options: ['New', 'Good', 'Fair', 'Weak', 'Needs Replacement'] },
    { id: 51, section: 'Electrical Systems', name: 'Alternator Output', type: 'number', required: false },
    { id: 52, section: 'Electrical Systems', name: 'Warning Lights', type: 'checkbox', required: true, options: ['Check Engine', 'ABS', 'Airbag', 'Oil Pressure', 'Battery', 'None'] },
    { id: 53, section: 'Electrical Systems', name: 'All Lights Working', type: 'checkbox', required: true, options: ['Headlights', 'Tail Lights', 'Brake Lights', 'Turn Signals', 'Hazards', 'Interior Lights'] },
    { id: 54, section: 'Safety Features', name: 'Airbag System', type: 'select', required: true, options: ['All Working', 'Some Issues', 'Warning Light On', 'Not Working', 'Unknown'] },
    { id: 55, section: 'Safety Features', name: 'ABS System', type: 'select', required: true, options: ['Working Properly', 'Warning Light', 'Not Working', 'Not Equipped'] },
    { id: 56, section: 'Safety Features', name: 'Seatbelts', type: 'select', required: true, options: ['All Working', 'Some Issues', 'Damaged', 'Missing'] },
    { id: 57, section: 'Safety Features', name: 'Emergency Equipment', type: 'checkbox', required: true, options: ['Fire Extinguisher', 'First Aid Kit', 'Emergency Triangle', 'Spare Tire', 'Jack', 'None'] },
  ],
};

const fallbackTypes = [
  { id: 1, name: 'Seller Form', slug: 'seller-form' },
  { id: 2, name: 'Buyer Basic Test', slug: 'buyer-basic-test' },
  { id: 3, name: 'Buyer Advanced Test', slug: 'buyer-advanced-test' },
];

const slugFromName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const lookupName = (item: CarLookupItem) => item.name || item.label || item.value || `#${item.id}`;

const ManualExaminationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [carForm, setCarForm] = useState<CarFormState>(initialCarForm);
  const [inspectionTypeId, setInspectionTypeId] = useState('3');
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [fieldNotes, setFieldNotes] = useState<Record<number, string>>({});
  const [fieldScores, setFieldScores] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [flagReasons, setFlagReasons] = useState<Record<number, string>>({});
  const [totalScore, setTotalScore] = useState('');
  const [overallCondition, setOverallCondition] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [formError, setFormError] = useState('');

  const { data: brands = [] } = useGetCarBrandsQuery();
  const { data: models = [] } = useGetCarModelsByBrandQuery(carForm.brand_id ? Number(carForm.brand_id) : undefined);
  const { data: categories = [] } = useGetCarCategoriesQuery();
  const { data: features = [] } = useGetCarFeaturesQuery();
  const { data: customFields = [] } = useGetCarCustomFieldsQuery();
  const { data: inspectionTypes = [] } = useGetCarInspectionTypesQuery();
  const { data: countriesResponse } = useGetManualCountriesQuery();
  const { data: statesResponse } = useGetManualStatesByCountryQuery(Number(carForm.country_id), { skip: !carForm.country_id });
  const { data: citiesResponse } = useGetManualCitiesByStateQuery(Number(carForm.state_id), { skip: !carForm.state_id });
  const [createManualExamination, { isLoading: isSubmitting }] = useCreateManualExaminationMutation();

  const availableInspectionTypes = inspectionTypes.length > 0
    ? inspectionTypes.map((type) => ({ ...type, slug: slugFromName(type.name) }))
    : fallbackTypes;

  const selectedInspectionType = availableInspectionTypes.find((type) => String(type.id) === inspectionTypeId);
  const selectedTemplateKey = selectedInspectionType?.slug || 'buyer-advanced-test';
  const templates = fieldTemplatesByType[selectedTemplateKey] || fieldTemplatesByType['buyer-advanced-test'];

  const groupedFields = useMemo(() => {
    return templates.reduce<Record<string, FieldTemplate[]>>((groups, field) => {
      groups[field.section] = groups[field.section] || [];
      groups[field.section].push(field);
      return groups;
    }, {});
  }, [templates]);

  const countries = countriesResponse?.data || [];
  const states = statesResponse?.data || [];
  const cities = citiesResponse?.data || [];

  const updateCarField = (field: keyof CarFormState, value: string) => {
    setCarForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'brand_id' ? { model_id: '' } : {}),
      ...(field === 'country_id' ? { state_id: '', city_id: '' } : {}),
      ...(field === 'state_id' ? { city_id: '' } : {}),
    }));
  };

  const requiredCarFields: Array<keyof CarFormState> = [
    'vin',
    'description',
    'brand_id',
    'model_id',
    'color_id',
    'condition',
    'milage',
    'manufacture_year',
    'transmission',
    'fuel_type',
    'location',
    'country_id',
    'state_id',
    'main_photo',
  ];

  const validateCarStep = () => {
    const missing = requiredCarFields.filter((field) => !carForm[field]);
    if (missing.length > 0) {
      setFormError('Please complete all required car fields before continuing.');
      return false;
    }
    if (carForm.vin.length !== 17) {
      setFormError('VIN must be exactly 17 characters.');
      return false;
    }
    if (carForm.description.length < 10) {
      setFormError('Description must be at least 10 characters.');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateExaminationStep = () => {
    const missing = templates.filter((field) => field.required && (
      fieldValues[String(field.id)] === undefined ||
      fieldValues[String(field.id)] === '' ||
      (Array.isArray(fieldValues[String(field.id)]) && (fieldValues[String(field.id)] as unknown[]).length === 0)
    ));
    if (missing.length > 0) {
      setFormError(`Please complete required examination fields: ${missing.map((field) => field.name).slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
      return false;
    }
    setFormError('');
    return true;
  };

  const continueToExamination = () => {
    if (validateCarStep()) setStep(2);
  };

  const buildPayload = (): ManualExaminationCreatePayload => {
    const car: ManualExaminationCarPayload = {
      vin: carForm.vin,
      plate_number: carForm.plate_number || undefined,
      description: carForm.description,
      brand_id: Number(carForm.brand_id),
      model_id: Number(carForm.model_id),
      category_id: carForm.category_id ? Number(carForm.category_id) : undefined,
      color_id: Number(carForm.color_id),
      condition: carForm.condition as 'new' | 'used',
      milage: Number(carForm.milage),
      manufacture_year: Number(carForm.manufacture_year),
      transmission: carForm.transmission,
      fuel_type: carForm.fuel_type,
      location: carForm.location,
      price: carForm.price ? Number(carForm.price) : undefined,
      country_id: Number(carForm.country_id),
      state_id: Number(carForm.state_id),
      city_id: carForm.city_id ? Number(carForm.city_id) : undefined,
      main_photo: Number(carForm.main_photo),
      photos: carForm.photos || undefined,
      features: carForm.features,
      custom_fields: customFields
        .map((field) => ({ field_id: field.id, value: fieldValues[`custom-${field.id}`] }))
        .filter((field) => field.value !== undefined && field.value !== ''),
    };

    const values: ManualExaminationFieldValuePayload[] = templates.map((field) => ({
      field_id: field.id,
      value: fieldValues[String(field.id)] ?? null,
      score: fieldScores[field.id] ? Number(fieldScores[field.id]) : undefined,
      notes: fieldNotes[field.id] || undefined,
      is_flagged: flagged[field.id] || false,
      flag_reason: flagged[field.id] ? flagReasons[field.id] || undefined : undefined,
    }));

    return {
      car,
      inspection_type_id: Number(inspectionTypeId),
      field_values: values,
      total_score: totalScore ? Number(totalScore) : undefined,
      overall_condition: overallCondition as ManualExaminationCreatePayload['overall_condition'],
      inspector_notes: inspectorNotes || undefined,
      recommendations: recommendations || undefined,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCarStep() || !validateExaminationStep()) return;

    try {
      await createManualExamination(buildPayload()).unwrap();
      navigate('/manual-examinations');
    } catch (error: any) {
      setFormError(error?.data?.error?.message || 'Failed to create manual examination.');
    }
  };

  const renderSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: Array<{ id: number | string; name: string }>,
    required = false,
  ) => (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );

  const renderTextInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    type = 'text',
    required = false,
  ) => (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        required={required}
      />
    </label>
  );

  const renderFieldInput = (field: FieldTemplate) => {
    const value = fieldValues[String(field.id)];
    const setValue = (nextValue: unknown) => setFieldValues((current) => ({ ...current, [String(field.id)]: nextValue }));

    if (field.type === 'textarea') {
      return (
        <textarea
          value={String(value || '')}
          onChange={(event) => setValue(event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          rows={3}
          required={field.required}
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <select
          value={value === undefined ? '' : String(value)}
          onChange={(event) => setValue(event.target.value === 'true')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          required={field.required}
        >
          <option value="">Select</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    if (field.type === 'select' || field.type === 'radio') {
      return (
        <select
          value={String(value || '')}
          onChange={(event) => setValue(event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          required={field.required}
        >
          <option value="">Select</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'checkbox') {
      const selected = Array.isArray(value) ? value as string[] : [];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(field.options || []).map((option) => (
            <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  setValue(event.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option));
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={String(value || '')}
        onChange={(event) => setValue(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        required={field.required}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/manual-examinations')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Manual Examination</h1>
            <p className="text-sm text-gray-600 mt-1">Step {step} of 2</p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-2 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 text-sm">
            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'}`}>
              {step === 1 ? '1' : <CheckCircle className="h-4 w-4" />}
            </span>
            <span className={step === 1 ? 'font-medium text-blue-700' : 'font-medium text-gray-700'}>Car Information</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>2</span>
            <span className={step === 2 ? 'font-medium text-blue-700' : 'text-gray-500'}>Examination Details</span>
          </div>
        </div>

        {step === 1 ? (
          <div className="p-4 sm:p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Car Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderTextInput('VIN', carForm.vin, (value) => updateCarField('vin', value), 'text', true)}
                {renderTextInput('Plate Number', carForm.plate_number, (value) => updateCarField('plate_number', value))}
                {renderSelect('Condition', carForm.condition, (value) => updateCarField('condition', value), [{ id: 'new', name: 'New' }, { id: 'used', name: 'Used' }], true)}
                {renderSelect('Brand', carForm.brand_id, (value) => updateCarField('brand_id', value), brands.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
                {renderSelect('Model', carForm.model_id, (value) => updateCarField('model_id', value), models.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
                {renderSelect('Category', carForm.category_id, (value) => updateCarField('category_id', value), categories.map((item) => ({ id: item.id, name: lookupName(item) })))}
                {renderTextInput('Color ID', carForm.color_id, (value) => updateCarField('color_id', value), 'number', true)}
                {renderTextInput('Manufacture Year', carForm.manufacture_year, (value) => updateCarField('manufacture_year', value), 'number', true)}
                {renderTextInput('Mileage', carForm.milage, (value) => updateCarField('milage', value), 'number', true)}
                {renderTextInput('Price', carForm.price, (value) => updateCarField('price', value), 'number')}
                {renderSelect('Transmission', carForm.transmission, (value) => updateCarField('transmission', value), [{ id: 'automatic', name: 'Automatic' }, { id: 'manual', name: 'Manual' }], true)}
                {renderSelect('Fuel Type', carForm.fuel_type, (value) => updateCarField('fuel_type', value), [{ id: 'petrol', name: 'Petrol' }, { id: 'diesel', name: 'Diesel' }, { id: 'electric', name: 'Electric' }, { id: 'hybrid', name: 'Hybrid' }], true)}
                {renderTextInput('Location', carForm.location, (value) => updateCarField('location', value), 'text', true)}
                {renderSelect('Country', carForm.country_id, (value) => updateCarField('country_id', value), countries, true)}
                {renderSelect('State', carForm.state_id, (value) => updateCarField('state_id', value), states, true)}
                {renderSelect('City', carForm.city_id, (value) => updateCarField('city_id', value), cities)}
                {renderTextInput('Main Photo Upload ID', carForm.main_photo, (value) => updateCarField('main_photo', value), 'number', true)}
                {renderTextInput('Gallery Photo IDs', carForm.photos, (value) => updateCarField('photos', value))}
              </div>
              <label className="block mt-4">
                <span className="block text-sm font-medium text-gray-700 mb-1">Description<span className="text-red-500 ml-1">*</span></span>
                <textarea
                  value={carForm.description}
                  onChange={(event) => updateCarField('description', event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={5}
                  required
                />
              </label>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {features.map((feature) => (
                  <label key={feature.id} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={carForm.features.includes(feature.id)}
                      onChange={(event) => {
                        setCarForm((current) => ({
                          ...current,
                          features: event.target.checked
                            ? [...current.features, feature.id]
                            : current.features.filter((id) => id !== feature.id),
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {lookupName(feature)}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.length === 0 ? (
                  <p className="text-sm text-gray-500">No custom fields configured.</p>
                ) : customFields.map((field) => (
                  <label key={field.id} className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {lookupName(field)}{field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={String(fieldValues[`custom-${field.id}`] || '')}
                      onChange={(event) => setFieldValues((current) => ({ ...current, [`custom-${field.id}`]: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </label>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={continueToExamination}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Examination Type</h2>
              {renderSelect('Inspection Type', inspectionTypeId, setInspectionTypeId, availableInspectionTypes.map((item) => ({ id: item.id, name: item.name })), true)}
            </section>

            {Object.entries(groupedFields).map(([section, fields]) => (
              <section key={section}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{section}</h2>
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-5">
                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">
                              {field.name}{field.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            {renderFieldInput(field)}
                          </label>
                        </div>
                        <div className="lg:col-span-2">
                          {renderTextInput('Score', fieldScores[field.id] || '', (value) => setFieldScores((current) => ({ ...current, [field.id]: value })), 'number')}
                        </div>
                        <div className="lg:col-span-3">
                          {renderTextInput('Notes', fieldNotes[field.id] || '', (value) => setFieldNotes((current) => ({ ...current, [field.id]: value })))}
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-7">
                            <input
                              type="checkbox"
                              checked={flagged[field.id] || false}
                              onChange={(event) => setFlagged((current) => ({ ...current, [field.id]: event.target.checked }))}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            Flag
                          </label>
                          {flagged[field.id] && renderTextInput('Reason', flagReasons[field.id] || '', (value) => setFlagReasons((current) => ({ ...current, [field.id]: value })))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderTextInput('Total Score', totalScore, setTotalScore, 'number')}
                {renderSelect('Overall Condition', overallCondition, setOverallCondition, [
                  { id: 'excellent', name: 'Excellent' },
                  { id: 'good', name: 'Good' },
                  { id: 'fair', name: 'Fair' },
                  { id: 'poor', name: 'Poor' },
                  { id: 'critical', name: 'Critical' },
                ])}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Inspector Notes</span>
                  <textarea value={inspectorNotes} onChange={(event) => setInspectorNotes(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" rows={4} />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Recommendations</span>
                  <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" rows={4} />
                </label>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Back to Car Information
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Creating...' : 'Create Manual Examination'}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ManualExaminationCreatePage;

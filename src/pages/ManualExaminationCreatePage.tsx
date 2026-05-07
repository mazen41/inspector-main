import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  useCreateManualExaminationMutation,
  useGetCarBrandsQuery,
  useGetCarCategoriesQuery,
  useGetCarColorsQuery,
  useGetCarInspectionTypesQuery,
  useGetCarModelsByBrandQuery,
  useGetManualCountriesQuery,
  useGetManualStatesByCountryQuery,
} from '../store/api/manualExaminationApi';
import { useUploadInspectionPhotoMutation } from '../store/api/inspectionApi';
import { useFormValidation } from '../hooks/useFormValidation';
import { useInspectionNavigation } from '../hooks/useInspectionNavigation';
import {
  InspectionCompletionModal,
  FieldPhotoUpload,
  InspectionFieldsRenderer,
  InspectionFormHeader,
  InspectionFormSummary,
} from '../components/inspections';
import InspectionFormProgress from '../components/inspections/InspectionFormProgress';
import { FormErrorDisplay, UnsavedChangesModal } from '../components/common';
import type { RootState } from '../store';
import type {
  CarLookupItem,
  FieldValue,
  Inspection,
  InspectionFormState,
  InspectionPhoto,
  InspectionSection,
  Country,
  ManualExaminationCarPayload,
  ManualExaminationCreatePayload,
  ManualExaminationDetail,
  ManualExaminationFieldValuePayload,
  State,
} from '../types';
import type { InspectionCompletionData } from '../types/form';
import { compressImageIfNeeded } from '../utils/photoValidation';

type CarFormState = {
  vin: string;
  description: string;
  brand_id: string;
  model_id: string;
  category_id: string;
  color_id: string;
  condition: 'new' | 'used' | '';
  milage: string;
  manufacture_year: string;
  fuel_type: string;
  transmission: 'manual' | 'automatic' | '';
  location: string;
  country_id: string;
  state_id: string;
};

const initialCarForm: CarFormState = {
  vin: '',
  description: '',
  brand_id: '',
  model_id: '',
  category_id: '',
  color_id: '',
  condition: '',
  milage: '',
  manufacture_year: '',
  fuel_type: 'petrol',
  transmission: '',
  location: '',
  country_id: '',
  state_id: '',
};

const lookupName = (item: CarLookupItem) => item.name || item.label || item.value || `#${item.id}`;
const isEmptyValue = (value: FieldValue) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return fallback;
  if (typeof error === 'object' && error !== null) {
    return fallback;
  }
  return fallback;
};

const arabicTextMap: Record<string, string> = {
  'Manual Examination': 'فحص يدوي',
  'New Manual Examination': 'فحص يدوي جديد',
  'Car Information': 'بيانات المركبة',
  'Inspection Type': 'نوع الفحص',
  VIN: 'رقم الهيكل',
  Condition: 'حالة المركبة',
  Brand: 'الشركة المصنعة',
  Model: 'الطراز',
  Category: 'الفئة',
  Color: 'اللون',
  'Manufacture Year': 'سنة الصنع',
  Mileage: 'الممشى',
  'Fuel Type': 'نوع الوقود',
  Transmission: 'ناقل الحركة',
  Location: 'الموقع',
  Country: 'الدولة',
  State: 'المنطقة',
  Description: 'وصف المركبة',
  New: 'جديدة',
  Used: 'مستعملة',
  Petrol: 'بنزين',
  Diesel: 'ديزل',
  Electric: 'كهرباء',
  Hybrid: 'هايبرد',
  Automatic: 'أوتوماتيك',
  Manual: 'يدوي',
};

const containsArabic = (value?: string | null) => Boolean(value && /[\u0600-\u06FF]/.test(value));
const toArabicText = (value?: string | null, fallback = 'حقل الفحص') => {
  if (!value) return fallback;
  if (containsArabic(value)) return value;
  return arabicTextMap[value] || fallback;
};

type PendingInspectionPhoto = InspectionPhoto & { file?: File; isPending?: boolean };

const ManualExaminationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const currentLanguage = useSelector((state: RootState) => state.localization?.currentLanguage);

  const [carForm, setCarForm] = useState<CarFormState>(initialCarForm);
  const [inspectionTypeId, setInspectionTypeId] = useState('');
  const [fieldNotes, setFieldNotes] = useState<Record<number, string>>({});
  const [fieldPhotos, setFieldPhotos] = useState<Record<number, PendingInspectionPhoto[]>>({});
  const [vehiclePhotos, setVehiclePhotos] = useState<PendingInspectionPhoto[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<{ status: 'idle' | 'validating' | 'submitting' | 'success' | 'error'; error?: string }>({ status: 'idle' });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [createdExamination, setCreatedExamination] = useState<ManualExaminationDetail | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: brands = [], isLoading: isLoadingBrands } = useGetCarBrandsQuery();
  const { data: models = [], isLoading: isLoadingModels } = useGetCarModelsByBrandQuery(
    carForm.brand_id ? Number(carForm.brand_id) : skipToken
  );
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCarCategoriesQuery();
  const { data: colors = [], isLoading: isLoadingColors } = useGetCarColorsQuery();
  const { data: inspectionTypes = [], isLoading: isLoadingInspectionTypes, error: inspectionTypesError } = useGetCarInspectionTypesQuery();
  const { data: countriesRes, isLoading: isLoadingCountries } = useGetManualCountriesQuery();
  const { data: statesRes, isLoading: isLoadingStates } = useGetManualStatesByCountryQuery(
    carForm.country_id ? Number(carForm.country_id) : skipToken
  );

  const [createManualExamination] = useCreateManualExaminationMutation();
  const [uploadInspectionPhoto] = useUploadInspectionPhotoMutation();
  const countries = countriesRes?.data || [];
  const states = statesRes?.data || [];
  const selectedInspectionType = inspectionTypes.find((type) => String(type.id) === inspectionTypeId);
  const isLoading = isLoadingBrands || isLoadingModels || isLoadingCategories || isLoadingColors || isLoadingInspectionTypes || isLoadingCountries || isLoadingStates;

  useEffect(() => {
    if (inspectionTypes.length > 0 && !inspectionTypeId) {
      setInspectionTypeId(String(inspectionTypes[0].id));
    }
  }, [inspectionTypes, inspectionTypeId]);

  const sections: InspectionSection[] = useMemo(() => {
    return (selectedInspectionType?.sections || []).map((section) => ({
      id: section.id,
      name: toArabicText(section.name, `قسم الفحص ${section.id}`),
      description: containsArabic(section.description) ? section.description : undefined,
      fields: (section.fields || []).map((field) => {
        const options = Array.isArray(field.options) ? field.options : field.options?.options || [];
        return {
          id: field.id,
          name: toArabicText(field.name, `حقل الفحص ${field.id}`),
          display_name: toArabicText(field.name, `حقل الفحص ${field.id}`),
          description: undefined,
          field_type: field.type,
          type: field.type,
          field_options: { options: options.map((option) => toArabicText(String(option), String(option))) },
          options: options.map((option) => toArabicText(String(option), String(option))),
          is_required: field.is_required,
          required: field.is_required,
          order: field.order,
          sort_order: field.order,
          metadata: { width: 'full' },
          value: null,
          photos: [],
        };
      }),
    }));
  }, [selectedInspectionType]);

  const fields = useMemo(() => sections.flatMap((section) => section.fields), [sections]);
  const initialValues = useMemo(() => fields.reduce<Record<number, FieldValue>>((values, field) => {
    values[field.id] = null;
    return values;
  }, {}), [fields]);

  const formValidation = useFormValidation(fields, initialValues, {
    validateOnChange: true,
    validateOnBlur: true,
  });
  const resetInspectionForm = formValidation.resetForm;

  useEffect(() => {
    resetInspectionForm(initialValues);
    setFieldNotes({});
    setFieldPhotos({});
    setFormErrors([]);
    setSubmissionStatus({ status: 'idle' });
    setCreatedExamination(null);
  }, [inspectionTypeId, initialValues, resetInspectionForm]);

  const formState: InspectionFormState = useMemo(() => ({
    fields: formValidation.fieldStates,
    isSubmitting: formValidation.isSubmitting,
    isDirty: formValidation.isDirty,
    isValid: formValidation.isValid,
  }), [formValidation.fieldStates, formValidation.isDirty, formValidation.isSubmitting, formValidation.isValid]);

  const carHasUnsavedChanges = Object.entries(carForm).some(([field, value]) => (
    value !== initialCarForm[field as keyof CarFormState]
  ));
  const hasUnsavedChanges = formValidation.isDirty || Object.values(fieldNotes).some(Boolean) || vehiclePhotos.length > 0 || carHasUnsavedChanges;

  const syntheticInspection: Inspection = useMemo(() => ({
    id: createdExamination?.id || 0,
    inspection_number: createdExamination?.inspection_number || 'فحص يدوي جديد',
    status: createdExamination?.status as Inspection['status'] || 'in_progress',
    scheduled_at: null,
    started_at: undefined,
    completed_at: createdExamination?.completed_at || undefined,
    cancelled_at: undefined,
    car: {
      id: createdExamination?.car?.id || 0,
      name: `${brands.find((item) => String(item.id) === carForm.brand_id)?.name || 'فحص'} ${models.find((item) => String(item.id) === carForm.model_id)?.name || 'يدوي'}`,
      brand: brands.find((item) => String(item.id) === carForm.brand_id)?.name || '',
      model: models.find((item) => String(item.id) === carForm.model_id)?.name || '',
      year: carForm.manufacture_year ? Number(carForm.manufacture_year) : undefined,
      color: colors.find((item) => String(item.id) === carForm.color_id)?.name,
      vin: carForm.vin,
      license_plate: '',
      fuel_type: carForm.fuel_type,
      transmission_type: carForm.transmission,
    },
    sections,
    inspection_type: {
      id: selectedInspectionType?.id || 0,
      name: toArabicText(selectedInspectionType?.name, 'فحص يدوي'),
      description: selectedInspectionType?.description,
      price: selectedInspectionType?.price || 0,
      estimated_duration: 0,
      sections,
    },
    customer: {
      id: 0,
      name: 'فحص يدوي',
    },
    actions: {
      can_start: false,
      can_complete: !createdExamination,
      can_cancel: false,
      is_editable: !createdExamination,
    },
    report_url: createdExamination ? `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/inspector/manual-examinations/${createdExamination.id}/download-pdf` : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }), [brands, carForm, colors, createdExamination, models, sections, selectedInspectionType]);

  const updateCarField = (field: keyof CarFormState, value: string) => {
    setCreatedExamination(null);
    setCarForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'brand_id' ? { model_id: '' } : {}),
      ...(field === 'country_id' ? { state_id: '' } : {}),
    }));
  };

  const validateCarFields = useCallback(() => {
    const requiredCarFields: Array<keyof CarFormState> = [
      'vin',
      'description',
      'brand_id',
      'model_id',
      'color_id',
      'condition',
      'milage',
      'manufacture_year',
      'fuel_type',
      'transmission',
      'location',
      'country_id',
      'state_id',
    ];
    const missing = requiredCarFields.filter((field) => !carForm[field]);
    const errors: string[] = [];

    if (missing.length > 0) errors.push('يرجى إكمال جميع بيانات المركبة المطلوبة قبل الإرسال.');
    if (carForm.vin && carForm.vin.length !== 17) errors.push('يجب أن يتكون رقم الهيكل من 17 خانة بالضبط.');
    if (carForm.description && carForm.description.length < 10) errors.push('يجب ألا يقل وصف المركبة عن 10 أحرف.');

    return errors;
  }, [carForm]);

  const buildPayload = useCallback((completionData: InspectionCompletionData): ManualExaminationCreatePayload => {
    const car: ManualExaminationCarPayload = {
      vin: carForm.vin,
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
      country_id: Number(carForm.country_id),
      state_id: Number(carForm.state_id),
      city_id: undefined,
      main_photo: 0,
      photos: undefined,
      features: [],
      custom_fields: [],
    };

    const values: ManualExaminationFieldValuePayload[] = fields.map((field) => ({
      field_id: field.id,
      value: formValidation.getFieldValue(field.id) ?? null,
      notes: fieldNotes[field.id] || undefined,
      is_flagged: false,
    }));

    return {
      car,
      inspection_type_id: Number(inspectionTypeId),
      field_values: values,
      total_score: completionData.total_score,
      overall_condition: completionData.overall_condition,
      inspector_notes: completionData.inspector_notes,
      recommendations: completionData.recommendations,
    };
  }, [carForm, fieldNotes, fields, formValidation, inspectionTypeId]);

  const handleFormSubmit = useCallback(async () => {
    if (createdExamination) return;

    setSubmissionStatus({ status: 'validating' });
    setFormErrors([]);

    const carErrors = validateCarFields();
    const hasInspectionType = Boolean(inspectionTypeId);
    const hasFields = fields.length > 0;
    const formIsValid = await formValidation.validateForm();
    const missingRequired = fields.filter((field) => field.is_required && isEmptyValue(formValidation.getFieldValue(field.id)));
    const errors = [
      ...carErrors,
      ...(!hasInspectionType ? ['يرجى اختيار نوع الفحص.'] : []),
      ...(!hasFields ? ['لا توجد حقول فحص متاحة لهذا النوع.'] : []),
      ...(!formIsValid || missingRequired.length > 0 ? ['يرجى تصحيح أخطاء التحقق قبل الإرسال.'] : []),
    ];

    if (errors.length > 0) {
      setFormErrors(errors);
      setSubmissionStatus({ status: 'error', error: 'يرجى تصحيح أخطاء التحقق قبل الإرسال.' });
      return;
    }

    setSubmissionStatus({ status: 'idle' });
    setShowCompletionModal(true);
  }, [createdExamination, fields, formValidation, inspectionTypeId, validateCarFields]);

  const uploadPendingPhotos = useCallback(async (inspectionId: number) => {
    const pendingUploads = Object.entries(fieldPhotos).flatMap(([fieldId, photos]) =>
      photos
        .filter((photo): photo is PendingInspectionPhoto & { file: File } => Boolean(photo.file))
        .map((photo) => ({ fieldId: Number(fieldId), file: photo.file }))
    );

    for (const upload of pendingUploads) {
      const processedFile = await compressImageIfNeeded(upload.file, 2);
      await uploadInspectionPhoto({
        id: inspectionId,
        file: processedFile,
        fieldId: upload.fieldId,
      }).unwrap();
    }
  }, [fieldPhotos, uploadInspectionPhoto]);

  const uploadVehiclePhotos = useCallback(async (inspectionId: number) => {
    const files = vehiclePhotos
      .filter((photo): photo is PendingInspectionPhoto & { file: File } => Boolean(photo.file))
      .map((photo) => photo.file);

    if (files.length === 0) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append('photos[]', await compressImageIfNeeded(file, 2));
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}/inspector/manual-examinations/${inspectionId}/vehicle-photos`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        'App-Language': currentLanguage?.code || 'ar',
        'System-Key': import.meta.env.VITE_BACKEND_SYSTEM_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('تعذر رفع صور المركبة.');
    }
  }, [currentLanguage?.code, token, vehiclePhotos]);

  const handleCompletionSubmit = useCallback(async (completionData: InspectionCompletionData) => {
    try {
      setSubmissionStatus({ status: 'submitting' });
      const response = await createManualExamination(buildPayload(completionData)).unwrap();
      await uploadVehiclePhotos(response.data.id);
      await uploadPendingPhotos(response.data.id);
      setCreatedExamination(response.data);
      setSubmissionStatus({ status: 'success' });
      setShowCompletionModal(false);
      formValidation.resetForm(formValidation.getFormValues());

      window.setTimeout(() => {
        navigate(`/manual-examinations/${response.data.id}`);
      }, 1000);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'تعذر إنشاء الفحص اليدوي. يرجى المحاولة مرة أخرى.');
      setSubmissionStatus({ status: 'error', error: message });
      setFormErrors([message]);
      throw error;
    }
  }, [buildPayload, createManualExamination, formValidation, navigate, uploadPendingPhotos, uploadVehiclePhotos]);

  const handlePhotosChange = useCallback((fieldId: number, photos: InspectionPhoto[]) => {
    setFieldPhotos((current) => ({ ...current, [fieldId]: photos as PendingInspectionPhoto[] }));
  }, []);

  const handlePhotoDelete = useCallback((photoId: number) => {
    setFieldPhotos((current) => Object.entries(current).reduce<Record<number, PendingInspectionPhoto[]>>((next, [fieldId, photos]) => {
      const removed = photos.find((photo) => photo.id === photoId);
      if (removed?.isPending && removed.url?.startsWith('blob:')) {
        window.URL.revokeObjectURL(removed.url);
      }
      next[Number(fieldId)] = photos.filter((photo) => photo.id !== photoId);
      return next;
    }, {}));
  }, []);

  const handleVehiclePhotoDelete = useCallback((photoId: number) => {
    setVehiclePhotos((current) => {
      const removed = current.find((photo) => photo.id === photoId);
      if (removed?.isPending && removed.url?.startsWith('blob:')) {
        window.URL.revokeObjectURL(removed.url);
      }
      return current.filter((photo) => photo.id !== photoId);
    });
  }, []);

  const handleDownloadPdf = async () => {
    if (!createdExamination?.id || !syntheticInspection.report_url) return;

    setIsDownloadingPdf(true);
    try {
      const response = await fetch(syntheticInspection.report_url, {
        headers: {
          Accept: 'application/pdf',
          Authorization: token ? `Bearer ${token}` : '',
          'App-Language': currentLanguage?.code || 'ar',
          'System-Key': import.meta.env.VITE_BACKEND_SYSTEM_KEY,
        },
      });

      if (!response.ok) throw new Error('تعذر تنزيل ملف التقرير.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspection-report-${createdExamination.inspection_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'تعذر تنزيل ملف التقرير.');
      setFormErrors([message]);
      setSubmissionStatus({ status: 'error', error: message });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const navigation = useInspectionNavigation({
    hasUnsavedChanges: hasUnsavedChanges && !createdExamination,
    isSubmitting: submissionStatus.status === 'submitting' || submissionStatus.status === 'validating',
  });

  const renderInput = (label: string, field: keyof CarFormState, type = 'text', required = false) => (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2 text-right">
        {label}{required && <span className="text-red-500 mr-1">*</span>}
      </span>
      <input
        type={type}
        value={carForm[field]}
        onChange={(event) => updateCarField(field, event.target.value)}
        disabled={submissionStatus.status === 'submitting' || Boolean(createdExamination)}
        placeholder={`أدخل ${label}`}
        dir="rtl"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-right"
        required={required}
      />
    </label>
  );

  const renderSelect = (
    label: string,
    field: keyof CarFormState,
    options: Array<{ id: number | string; name: string }>,
    required = false,
  ) => (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2 text-right">
        {label}{required && <span className="text-red-500 mr-1">*</span>}
      </span>
      <select
        value={carForm[field]}
        onChange={(event) => updateCarField(field, event.target.value)}
        disabled={submissionStatus.status === 'submitting' || Boolean(createdExamination)}
        dir="rtl"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-right"
        required={required}
      >
        <option value="">اختر {label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (inspectionTypesError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-800 font-medium">تعذر تحميل أنواع الفحص</p>
          </div>
          <p className="text-red-600 text-sm mt-1">
            يرجى تحديث الصفحة أو التواصل مع الدعم إذا استمرت المشكلة.
          </p>
          <div className="mt-4">
            <button
              onClick={() => navigation.handleNavigation('/manual-examinations')}
              className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              العودة إلى الفحوصات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden" dir="rtl" lang="ar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-full">
        <InspectionFormHeader
          inspection={syntheticInspection}
          saveStatus={{ status: 'idle', hasUnsavedChanges: hasUnsavedChanges && !createdExamination }}
          submissionStatus={submissionStatus}
          onBack={() => navigation.handleNavigation('/manual-examinations')}
          onSubmit={handleFormSubmit}
          isSubmitting={submissionStatus.status === 'submitting' || submissionStatus.status === 'validating'}
          forceArabic={true}
        />

        {createdExamination && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6 flex justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              {isDownloadingPdf ? 'جار التنزيل...' : 'تنزيل التقرير'}
            </button>
          </div>
        )}

        <FormErrorDisplay
          errors={formErrors}
          submissionStatus={submissionStatus}
          className="mb-4 sm:mb-6"
        />

        {submissionStatus.status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 font-medium text-sm sm:text-base">تم إرسال الفحص بنجاح.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-right">بيانات المركبة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2 text-right">نوع الفحص<span className="text-red-500 mr-1">*</span></span>
              <select
                value={inspectionTypeId}
                onChange={(event) => setInspectionTypeId(event.target.value)}
                disabled={submissionStatus.status === 'submitting' || Boolean(createdExamination)}
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-right"
              >
                <option value="">اختر نوع الفحص</option>
                {inspectionTypes.map((type) => (
                  <option key={type.id} value={type.id}>{toArabicText(type.name, 'فحص يدوي')}</option>
                ))}
              </select>
            </label>
            {renderInput('رقم الهيكل', 'vin', 'text', true)}
            {renderSelect('حالة المركبة', 'condition', [{ id: 'new', name: 'جديدة' }, { id: 'used', name: 'مستعملة' }], true)}
            {renderSelect('الشركة المصنعة', 'brand_id', brands.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
            {renderSelect('الطراز', 'model_id', models.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
            {renderSelect('الفئة', 'category_id', categories.map((item) => ({ id: item.id, name: lookupName(item) })))}
            {renderSelect('اللون', 'color_id', colors.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
            {renderInput('سنة الصنع', 'manufacture_year', 'number', true)}
            {renderInput('الممشى', 'milage', 'number', true)}
            {renderSelect('نوع الوقود', 'fuel_type', [{ id: 'petrol', name: 'بنزين' }, { id: 'diesel', name: 'ديزل' }, { id: 'electric', name: 'كهرباء' }, { id: 'hybrid', name: 'هايبرد' }], true)}
            {renderSelect('ناقل الحركة', 'transmission', [{ id: 'automatic', name: 'أوتوماتيك' }, { id: 'manual', name: 'يدوي' }], true)}
            {renderInput('الموقع', 'location', 'text', true)}
            {renderSelect('الدولة', 'country_id', countries.map((country: Country) => ({ id: country.id, name: country.name })), true)}
            {renderSelect('المنطقة', 'state_id', states.map((state: State) => ({ id: state.id, name: state.name })), true)}
          </div>
          <label className="block mt-4 sm:mt-6">
            <span className="block text-sm font-medium text-gray-700 mb-2 text-right">وصف المركبة<span className="text-red-500 mr-1">*</span></span>
            <textarea
              value={carForm.description}
              onChange={(event) => updateCarField('description', event.target.value)}
              disabled={submissionStatus.status === 'submitting' || Boolean(createdExamination)}
              placeholder="اكتب وصفا واضحا لحالة المركبة وملاحظاتها"
              dir="rtl"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none text-right"
              rows={4}
              required
            />
          </label>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-right">صور المركبة</h2>
          <FieldPhotoUpload
            fieldId={0}
            photos={vehiclePhotos}
            onPhotosChange={(photos) => setVehiclePhotos(photos as PendingInspectionPhoto[])}
            onPhotoDelete={handleVehiclePhotoDelete}
            disabled={submissionStatus.status === 'submitting' || submissionStatus.status === 'validating' || Boolean(createdExamination)}
            maxPhotos={10}
            forceArabic={true}
          />
        </div>

        <InspectionFormProgress
          sections={sections}
          formState={formState}
          forceArabic={true}
        />

        <div className="space-y-8 w-full max-w-full overflow-x-hidden">
          <InspectionFieldsRenderer
            sections={sections}
            formState={formState}
            fieldNotes={fieldNotes}
            fieldPhotos={fieldPhotos}
            photoErrors={{}}
            inspectionId={undefined}
            onFieldChange={formValidation.setFieldValue}
            onFieldBlur={(fieldId) => formValidation.setFieldTouched(fieldId)}
            onNotesChange={(fieldId, notes) => setFieldNotes((current) => ({ ...current, [fieldId]: notes }))}
            onPhotosChange={handlePhotosChange}
            onPhotoDelete={handlePhotoDelete}
            disabled={submissionStatus.status === 'submitting' || submissionStatus.status === 'validating' || Boolean(createdExamination)}
            showLabels={true}
            showHelp={true}
            showRequired={true}
            enablePhotoUpload={true}
            forceArabicPhotoUpload={true}
          />

          {(formState.isDirty || Object.keys(formState.fields).length > 0) && (
            <div className="mt-6 sm:mt-8 w-full max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">ملخص الفحص</h2>
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto"
                >
                  {showSummary ? 'إخفاء الملخص' : 'عرض الملخص'}
                </button>
              </div>

              {showSummary && (
                <InspectionFormSummary
                  inspection={syntheticInspection}
                  formState={formState}
                />
              )}
            </div>
          )}
        </div>

        <InspectionCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onSubmit={handleCompletionSubmit}
          isSubmitting={submissionStatus.status === 'submitting'}
          inspectionNumber={syntheticInspection.inspection_number}
          forceArabic={true}
        />

        <UnsavedChangesModal
          isOpen={navigation.showUnsavedModal}
          onConfirm={navigation.handleModalConfirm}
          onCancel={navigation.handleModalCancel}
          showSaveOption={false}
          message="لديك تغييرات غير محفوظة سيتم فقدانها إذا غادرت هذه الصفحة."
        />
      </div>
    </div>
  );
};

export default ManualExaminationCreatePage;
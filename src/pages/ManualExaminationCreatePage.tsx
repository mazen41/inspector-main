import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle, ChevronLeft, Save } from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query/react';
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

import type {
  CarLookupItem,
  FieldType,
  ManualExaminationCarPayload,
  ManualExaminationCreatePayload,
  ManualExaminationFieldValuePayload,
} from '../types';

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
  price: string;
  transmission: 'manual' | 'automatic' | '';
  location: string;
  country_id: string;
  state_id: string;
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
  description: '',
  brand_id: '',
  model_id: '',
  category_id: '',
  color_id: '',
  condition: '',
  milage: '',
  manufacture_year: '',
  fuel_type: 'petrol',
  price: '',
  transmission: '',
  location: '',
  country_id: '',
  state_id: '',
};

// النماذج الاحتياطية في حال كان الـ API فارغاً
const fallbackTypes = [
  { id: 1, name: 'نموذج البائع', slug: 'seller-form' },
  { id: 2, name: 'فحص المشتري الأساسي', slug: 'buyer-basic-test' },
  { id: 3, name: 'فحص المشتري المتقدم', slug: 'buyer-advanced-test' },
];

const fieldTemplatesByType: Record<string, FieldTemplate[]> = {
  'seller-form': [
    { id: 1, section: 'معلومات المركبة', name: 'رقم الشاصي (VIN)', type: 'text', required: true },
    { id: 2, section: 'معلومات المركبة', name: 'قراءة العداد', type: 'number', required: true },
    { id: 3, section: 'معلومات المركبة', name: 'عدد الملاك السابقين', type: 'select', required: true, options: ['1', '2', '3', '4', '5+'] },
    { id: 4, section: 'معلومات المركبة', name: 'يوجد تاريخ حوادث؟', type: 'boolean', required: true },
    { id: 6, section: 'تقييم الحالة', name: 'الحالة العامة', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف'] },
    { id: 10, section: 'الوثائق', name: 'استمارة المركبة', type: 'boolean', required: true },
  ],
  'buyer-basic-test': [
    { id: 14, section: 'الفحص الخارجي', name: 'حالة البودي والطلاء', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يحتاج صيانة'] },
    { id: 15, section: 'الفحص الخارجي', name: 'أضرار الهيكل', type: 'checkbox', required: true, options: ['خدوش', 'طعجات', 'صدأ', 'أضرار تصادم', 'لا يوجد'] },
    { id: 16, section: 'الفحص الخارجي', name: 'حالة الإطارات', type: 'select', required: true, options: ['جديدة', 'جيدة', 'مقبولة', 'متآكلة', 'تحتاج تغيير'] },
    { id: 18, section: 'الفحص الداخلي', name: 'حالة المقاعد', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'متآكل', 'تالف'] },
    { id: 22, section: 'غرفة المحرك', name: 'سهولة تشغيل المحرك', type: 'boolean', required: true },
    { id: 26, section: 'تجربة القيادة', name: 'أداء القير (ناقل الحركة)', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يوجد مشكلة'] },
  ],
  'buyer-advanced-test': [
    { id: 30, section: 'الفحص الخارجي', name: 'حالة البودي والطلاء', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يحتاج صيانة'] },
    { id: 31, section: 'الفحص الخارجي', name: 'أضرار الهيكل', type: 'checkbox', required: true, options: ['خدوش', 'طعجات', 'صدأ', 'أضرار تصادم', 'لا يوجد'] },
    { id: 32, section: 'الفحص الخارجي', name: 'حالة الإطارات', type: 'select', required: true, options: ['جديدة', 'جيدة', 'مقبولة', 'متآكلة', 'تحتاج تغيير'] },
    { id: 34, section: 'الفحص الداخلي', name: 'حالة المقاعد', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'متآكل', 'تالف'] },
    { id: 38, section: 'غرفة المحرك', name: 'سهولة تشغيل المحرك', type: 'boolean', required: true },
    { id: 40, section: 'غرفة المحرك', name: 'مستويات السوائل', type: 'checkbox', required: true, options: ['زيت المحرك سليم', 'ماء الرديتر سليم', 'زيت الفرامل سليم', 'زيت الدركسون سليم'] },
    { id: 42, section: 'تجربة القيادة', name: 'أداء القير (ناقل الحركة)', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يوجد مشكلة'] },
    { id: 43, section: 'تجربة القيادة', name: 'أداء الفرامل', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'غير آمن'] },
    { id: 50, section: 'الأنظمة الكهربائية', name: 'حالة البطارية', type: 'select', required: true, options: ['جديدة', 'جيدة', 'مقبولة', 'ضعيفة', 'تحتاج تغيير'] },
  ],
};

const lookupName = (item: CarLookupItem) => item.name || item.label || item.value || `#${item.id}`;

void fallbackTypes;
void fieldTemplatesByType;

const ManualExaminationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [carForm, setCarForm] = useState<CarFormState>(initialCarForm);
  const [inspectionTypeId, setInspectionTypeId] = useState('');
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
  const { data: models = [] } = useGetCarModelsByBrandQuery(
    carForm.brand_id ? Number(carForm.brand_id) : skipToken
  );
  const { data: categories = [] } = useGetCarCategoriesQuery();
  const { data: colors = [] } = useGetCarColorsQuery();
  const { data: inspectionTypes = [] } = useGetCarInspectionTypesQuery();

  const { data: countriesRes } = useGetManualCountriesQuery();
  const countries = countriesRes?.data || [];

  const { data: statesRes } = useGetManualStatesByCountryQuery(
    carForm.country_id ? Number(carForm.country_id) : skipToken
  );
  const states = statesRes?.data || [];

  const [createManualExamination, { isLoading: isSubmitting }] = useCreateManualExaminationMutation();

  const availableInspectionTypes = inspectionTypes;

  useEffect(() => {
    if (availableInspectionTypes.length > 0 && !inspectionTypeId) {
      setInspectionTypeId(String(availableInspectionTypes[0].id));
    }
  }, [availableInspectionTypes, inspectionTypeId]);

  useEffect(() => {
    setFieldValues({});
    setFieldNotes({});
    setFieldScores({});
    setFlagged({});
    setFlagReasons({});
  }, [inspectionTypeId]);

  const selectedInspectionType = availableInspectionTypes.find((type) => String(type.id) === inspectionTypeId);

  const templates: FieldTemplate[] = useMemo(() => {
    if (!selectedInspectionType) return [];

    if ('sections' in selectedInspectionType && selectedInspectionType.sections) {
      return selectedInspectionType.sections.flatMap((section: any) =>
        (section.fields || []).map((field: any) => {
          let parsedOptions: string[] = [];
          if (Array.isArray(field.options)) {
            parsedOptions = field.options as string[];
          } else if (field.options && typeof field.options === 'object' && Array.isArray(field.options.options)) {
            parsedOptions = field.options.options;
          }

          return {
            id: field.id,
            name: field.name,
            type: field.type,
            required: field.is_required,
            options: parsedOptions,
            section: section.name,
          };
        })
      );
    }

    return [];
  }, [selectedInspectionType]);

  const groupedFields = useMemo(() => {
    return templates.reduce<Record<string, FieldTemplate[]>>((groups, field) => {
      groups[field.section] = groups[field.section] || [];
      groups[field.section].push(field);
      return groups;
    }, {});
  }, [templates]);

  const updateCarField = (field: keyof CarFormState, value: string) => {
    setCarForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'brand_id' ? { model_id: '' } : {}),
      ...(field === 'country_id' ? { state_id: '' } : {}),
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
    'fuel_type',
    'transmission',
    'location',
    'country_id',
    'state_id',
  ];

  const validateCarStep = () => {
    const missing = requiredCarFields.filter((field) => !carForm[field]);
    if (missing.length > 0) {
      setFormError('الرجاء إكمال جميع الحقول الإلزامية للسيارة قبل المتابعة.');
      return false;
    }
    if (carForm.vin.length !== 17) {
      setFormError('رقم الشاصي (VIN) يجب أن يكون 17 حرفاً ورقمياً بالضبط.');
      return false;
    }
    if (carForm.description.length < 10) {
      setFormError('وصف السيارة يجب أن يكون 10 أحرف على الأقل.');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateExaminationStep = () => {
    if (!inspectionTypeId) {
      setFormError('الرجاء اختيار نوع الفحص.');
      return false;
    }
    if (templates.length === 0) {
      setFormError('No inspection fields are available for this inspection type.');
      return false;
    }
    const missing = templates.filter((field) => field.required && (
      fieldValues[String(field.id)] === undefined ||
      fieldValues[String(field.id)] === '' ||
      (Array.isArray(fieldValues[String(field.id)]) && (fieldValues[String(field.id)] as unknown[]).length === 0)
    ));
    if (missing.length > 0) {
      setFormError(`Please complete required inspection fields: ${missing.map((field) => field.name).slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
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
      plate_number: undefined,
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
      city_id: undefined,
      main_photo: 0 as any,
      photos: undefined,
      features: [],
      custom_fields: [],
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
      setFormError(error?.data?.error?.message || 'فشل في إنشاء الفحص اليدوي.');
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
        {label}{required && <span className="text-red-500 mr-1">*</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        required={required}
      >
        <option value="">اختر {label}</option>
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
        {label}{required && <span className="text-red-500 mr-1">*</span>}
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
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <select
          value={value === undefined ? '' : String(value)}
          onChange={(event) => setValue(event.target.value === 'true')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">اختر</option>
          <option value="true">نعم</option>
          <option value="false">لا</option>
        </select>
      );
    }

    if (field.type === 'select' || field.type === 'radio') {
      return (
        <select
          value={String(value || '')}
          onChange={(event) => setValue(event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">اختر</option>
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
      />
    );
  };

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/manual-examinations')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">رجوع</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إنشاء فحص يدوي جديد</h1>
            <p className="text-sm text-gray-600 mt-1">الخطوة {step} من 2</p>
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
            <span className={step === 1 ? 'font-medium text-blue-700' : 'font-medium text-gray-700'}>معلومات السيارة</span>
            <ChevronLeft className="h-4 w-4 text-gray-400" />
            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>2</span>
            <span className={step === 2 ? 'font-medium text-blue-700' : 'text-gray-500'}>تفاصيل الفحص</span>
          </div>
        </div>

        {step === 1 ? (
          <div className="p-4 sm:p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">بيانات السيارة الأساسية</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderTextInput('رقم الشاصي (VIN)', carForm.vin, (value) => updateCarField('vin', value), 'text', true)}
                {renderSelect('حالة السيارة', carForm.condition, (value) => updateCarField('condition', value), [{ id: 'new', name: 'جديد' }, { id: 'used', name: 'مستعمل' }], true)}
                {renderSelect('الماركة', carForm.brand_id, (value) => updateCarField('brand_id', value), brands.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
                {renderSelect('الموديل', carForm.model_id, (value) => updateCarField('model_id', value), models.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
                {renderSelect('الفئة', carForm.category_id, (value) => updateCarField('category_id', value), categories.map((item) => ({ id: item.id, name: lookupName(item) })))}
                {renderSelect('اللون', carForm.color_id, (value) => updateCarField('color_id', value), colors.map((item) => ({ id: item.id, name: lookupName(item) })), true)}
                {renderTextInput('سنة الصنع', carForm.manufacture_year, (value) => updateCarField('manufacture_year', value), 'number', true)}
                {renderTextInput('المسافة المقطوعة', carForm.milage, (value) => updateCarField('milage', value), 'number', true)}
                {renderTextInput('السعر', carForm.price, (value) => updateCarField('price', value), 'number')}
                {renderSelect('نوع الوقود', carForm.fuel_type, (value) => updateCarField('fuel_type', value), [{ id: 'petrol', name: 'بنزين' }, { id: 'diesel', name: 'ديزل' }, { id: 'electric', name: 'كهرباء' }, { id: 'hybrid', name: 'هجين (هايبرد)' }], true)}
                {renderSelect('ناقل الحركة', carForm.transmission, (value) => updateCarField('transmission', value), [{ id: 'automatic', name: 'أوتوماتيك' }, { id: 'manual', name: 'يدوي' }], true)}
                {renderTextInput('الموقع', carForm.location, (value) => updateCarField('location', value), 'text', true)}
                {renderSelect('الدولة', carForm.country_id, (value) => updateCarField('country_id', value), countries.map((c: any) => ({ id: c.id, name: c.name })), true)}
                {renderSelect('المنطقة', carForm.state_id, (value) => updateCarField('state_id', value), states.map((s: any) => ({ id: s.id, name: s.name })), true)}
              </div>
              <label className="block mt-4">
                <span className="block text-sm font-medium text-gray-700 mb-1">الوصف<span className="text-red-500 mr-1">*</span></span>
                <textarea
                  value={carForm.description}
                  onChange={(event) => updateCarField('description', event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={5}
                  required
                />
              </label>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={continueToExamination}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                المتابعة
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">نوع الفحص</h2>
              {renderSelect('النموذج المستخدم للفحص', inspectionTypeId, setInspectionTypeId, availableInspectionTypes.map((item) => ({ id: item.id, name: item.name })), true)}
            </section>

            {Object.keys(groupedFields).length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد حقول فحص متاحة لهذا النموذج.</p>
            ) : (
              Object.entries(groupedFields).map(([section, fields]) => (
                <section key={section}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{section}</h2>
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-5">
                            <label className="block">
                              <span className="block text-sm font-medium text-gray-700 mb-1">
                                {field.name}
                              </span>
                              {renderFieldInput(field)}
                            </label>
                          </div>
                          <div className="lg:col-span-2">
                            {renderTextInput('التقييم', fieldScores[field.id] || '', (value) => setFieldScores((current) => ({ ...current, [field.id]: value })), 'number')}
                          </div>
                          <div className="lg:col-span-3">
                            {renderTextInput('ملاحظات', fieldNotes[field.id] || '', (value) => setFieldNotes((current) => ({ ...current, [field.id]: value })))}
                          </div>
                          <div className="lg:col-span-2 space-y-2">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-7">
                              <input
                                type="checkbox"
                                checked={flagged[field.id] || false}
                                onChange={(event) => setFlagged((current) => ({ ...current, [field.id]: event.target.checked }))}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                              تحديد كمشكلة
                            </label>
                            {flagged[field.id] && renderTextInput('السبب', flagReasons[field.id] || '', (value) => setFlagReasons((current) => ({ ...current, [field.id]: value })))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الملخص النهائي (حالة الإشراف)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderTextInput('التقييم الإجمالي', totalScore, setTotalScore, 'number')}
                {renderSelect('الحالة العامة للسيارة', overallCondition, setOverallCondition, [
                  { id: 'excellent', name: 'ممتاز' },
                  { id: 'good', name: 'جيد' },
                  { id: 'fair', name: 'مقبول' },
                  { id: 'poor', name: 'ضعيف' },
                  { id: 'critical', name: 'حالة حرجة' },
                ])}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">ملاحظات المشرف والفاحص</span>
                  <textarea value={inspectorNotes} onChange={(event) => setInspectorNotes(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" rows={4} />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-1">التوصيات</span>
                  <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" rows={4} />
                </label>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                الرجوع لمعلومات السيارة
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإنشاء الفحص اليدوي'}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ManualExaminationCreatePage;

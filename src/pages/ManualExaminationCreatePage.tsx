import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle, ChevronLeft, Save } from 'lucide-react';
import {
  useCreateManualExaminationMutation,
  useGetCarBrandsQuery,
  useGetCarCategoriesQuery,
  useGetCarInspectionTypesQuery,
  useGetCarModelsByBrandQuery,
} from '../store/api/manualExaminationApi';
// Import skipToken for conditional queries
import { skipToken } from '@reduxjs/toolkit/query/react';

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
};

// تم ترجمة جميع بيانات الفحص إلى اللغة العربية
const fieldTemplatesByType: Record<string, FieldTemplate[]> = {
  'seller-form': [
    { id: 1, section: 'معلومات المركبة', name: 'رقم الشاصي (VIN)', type: 'text', required: true },
    { id: 2, section: 'معلومات المركبة', name: 'قراءة العداد', type: 'number', required: true },
    { id: 3, section: 'معلومات المركبة', name: 'عدد الملاك السابقين', type: 'select', required: true, options: ['1', '2', '3', '4', '5+'] },
    { id: 4, section: 'معلومات المركبة', name: 'يوجد تاريخ حوادث؟', type: 'boolean', required: true },
    { id: 5, section: 'معلومات المركبة', name: 'تفاصيل الحوادث', type: 'textarea', required: false },
    { id: 6, section: 'تقييم الحالة', name: 'الحالة العامة', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف'] },
    { id: 7, section: 'تقييم الحالة', name: 'صيانة دورية؟', type: 'boolean', required: true },
    { id: 8, section: 'تقييم الحالة', name: 'سجلات الصيانة متوفرة؟', type: 'boolean', required: true },
    { id: 9, section: 'تقييم الحالة', name: 'أعطال معروفة', type: 'textarea', required: false },
    { id: 10, section: 'الوثائق', name: 'استمارة المركبة', type: 'boolean', required: true },
    { id: 11, section: 'الوثائق', name: 'شهادة الفحص الدوري', type: 'boolean', required: true },
    { id: 12, section: 'الوثائق', name: 'حالة الضمان', type: 'select', required: true, options: ['لا يوجد', 'ضمان الوكيل', 'ضمان ممدد', 'ضمان طرف ثالث'] },
  ],
  'buyer-basic-test': [
    { id: 14, section: 'الفحص الخارجي', name: 'حالة البودي والطلاء', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يحتاج صيانة'] },
    { id: 15, section: 'الفحص الخارجي', name: 'أضرار الهيكل', type: 'checkbox', required: true, options: ['خدوش', 'طعجات', 'صدأ', 'أضرار تصادم', 'لا يوجد'] },
    { id: 16, section: 'الفحص الخارجي', name: 'حالة الإطارات', type: 'select', required: true, options: ['جديدة', 'جيدة', 'مقبولة', 'متآكلة', 'تحتاج تغيير'] },
    { id: 17, section: 'الفحص الخارجي', name: 'حالة الزجاج الأمامي', type: 'select', required: true, options: ['سليم', 'خدوش بسيطة', 'مكسور', 'يحتاج تغيير'] },
    { id: 18, section: 'الفحص الداخلي', name: 'حالة المقاعد', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'متآكل', 'تالف'] },
    { id: 19, section: 'الفحص الداخلي', name: 'حالة الطبلون', type: 'select', required: true, options: ['سليم', 'جيد', 'باهت', 'متشقق', 'تالف'] },
    { id: 20, section: 'الفحص الداخلي', name: 'عمل الإلكترونيات', type: 'checkbox', required: true, options: ['المسجل', 'المكيف', 'التدفئة', 'النوافذ الكهربائية', 'الأقفال', 'الخرائط'] },
    { id: 21, section: 'الفحص الداخلي', name: 'نظافة الداخلية', type: 'select', required: true, options: ['نظيف جداً', 'نظيف', 'مقبول', 'متسخ', 'متسخ جداً'] },
    { id: 22, section: 'غرفة المحرك', name: 'سهولة تشغيل المحرك', type: 'boolean', required: true },
    { id: 23, section: 'غرفة المحرك', name: 'صوت المحرك والتفتفة', type: 'select', required: true, options: ['صافي', 'تفتفة بسيطة', 'تفتفة قوية'] },
    { id: 24, section: 'غرفة المحرك', name: 'مستويات السوائل', type: 'checkbox', required: true, options: ['زيت المحرك سليم', 'ماء الرديتر سليم', 'زيت الفرامل سليم', 'زيت الدركسون سليم'] },
    { id: 25, section: 'غرفة المحرك', name: 'يوجد تهريبات واضحة؟', type: 'boolean', required: true },
    { id: 26, section: 'تجربة القيادة', name: 'أداء القير (ناقل الحركة)', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يوجد مشكلة'] },
    { id: 27, section: 'تجربة القيادة', name: 'أداء الفرامل', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'غير آمن'] },
    { id: 28, section: 'تجربة القيادة', name: 'استجابة الدركسون', type: 'select', required: true, options: ['ممتازة', 'جيدة', 'مقبولة', 'يوجد فضاوه', 'يوجد مشكلة'] },
    { id: 29, section: 'تجربة القيادة', name: 'أصوات غير طبيعية', type: 'textarea', required: false },
  ],
  'buyer-advanced-test': [
    { id: 30, section: 'الفحص الخارجي', name: 'حالة البودي والطلاء', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يحتاج صيانة'] },
    { id: 31, section: 'الفحص الخارجي', name: 'أضرار الهيكل', type: 'checkbox', required: true, options: ['خدوش', 'طعجات', 'صدأ', 'أضرار تصادم', 'لا يوجد'] },
    { id: 32, section: 'الفحص الخارجي', name: 'حالة الإطارات', type: 'select', required: true, options: ['جديدة', 'جيدة', 'مقبولة', 'متآكلة', 'تحتاج تغيير'] },
    { id: 33, section: 'الفحص الخارجي', name: 'حالة الزجاج الأمامي', type: 'select', required: true, options: ['سليم', 'خدوش بسيطة', 'مكسور', 'يحتاج تغيير'] },
    { id: 34, section: 'الفحص الداخلي', name: 'حالة المقاعد', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'متآكل', 'تالف'] },
    { id: 35, section: 'الفحص الداخلي', name: 'حالة الطبلون', type: 'select', required: true, options: ['سليم', 'جيد', 'باهت', 'متشقق', 'تالف'] },
    { id: 36, section: 'الفحص الداخلي', name: 'عمل الإلكترونيات', type: 'checkbox', required: true, options: ['المسجل', 'المكيف', 'التدفئة', 'النوافذ الكهربائية', 'الأقفال', 'الخرائط'] },
    { id: 37, section: 'الفحص الداخلي', name: 'نظافة الداخلية', type: 'select', required: true, options: ['نظيف جداً', 'نظيف', 'مقبول', 'متسخ', 'متسخ جداً'] },
    { id: 38, section: 'غرفة المحرك', name: 'سهولة تشغيل المحرك', type: 'boolean', required: true },
    { id: 39, section: 'غرفة المحرك', name: 'صوت المحرك والتفتفة', type: 'select', required: true, options: ['صافي', 'تفتفة بسيطة', 'تفتفة قوية'] },
    { id: 40, section: 'غرفة المحرك', name: 'مستويات السوائل', type: 'checkbox', required: true, options: ['زيت المحرك سليم', 'ماء الرديتر سليم', 'زيت الفرامل سليم', 'زيت الدركسون سليم'] },
    { id: 41, section: 'غرفة المحرك', name: 'يوجد تهريبات واضحة؟', type: 'boolean', required: true },
    { id: 42, section: 'تجربة القيادة', name: 'أداء القير (ناقل الحركة)', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'يوجد مشكلة'] },
    { id: 43, section: 'تجربة القيادة', name: 'أداء الفرامل', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مقبول', 'ضعيف', 'غير آمن'] },
    { id: 44, section: 'تجربة القيادة', name: 'استجابة الدركسون', type: 'select', required: true, options: ['ممتازة', 'جيدة', 'مقبولة', 'يوجد فضاوه', 'يوجد مشكلة'] },
    { id: 45, section: 'تجربة القيادة', name: 'أصوات غير طبيعية', type: 'textarea', required: false },
    { id: 46, section: 'الأنظمة الميكانيكية', name: 'نتيجة فحص ضغط البساتم', type: 'text', required: false },
    { id: 47, section: 'الأنظمة الميكانيكية', name: 'نظام التعليق (المساعدات والمقصات)', type: 'select', required: true, options: ['ممتاز', 'جيد', 'مستهلك', 'يحتاج صيانة', 'يحتاج تغيير'] },
    { id: 48, section: 'الأنظمة الميكانيكية', name: 'نظام العادم (الشكمان)', type: 'select', required: true, options: ['سليم', 'جيد', 'مشاكل بسيطة', 'يحتاج إصلاح', 'يحتاج تغيير'] },
    { id: 49, section: 'الأنظمة الميكانيكية', name: 'سير التيمن / الجنزير', type: 'select', required: true, options: ['مُبدل حديثاً', 'حالة جيدة', 'يحتاج فحص', 'يحتاج تغيير', 'غير معلوم'] },
    { id: 50, section: 'الأنظمة الكهربائية', name: 'حالة البطارية', type: 'select', required: true, options: ['جديدة', 'جيدة', 'مقبولة', 'ضعيفة', 'تحتاج تغيير'] },
    { id: 51, section: 'الأنظمة الكهربائية', name: 'قراءة شحن الدينامو', type: 'number', required: false },
    { id: 52, section: 'الأنظمة الكهربائية', name: 'اللمبات التحذيرية في الطبلون', type: 'checkbox', required: true, options: ['المحرك (Check Engine)', 'مانع الانزلاق (ABS)', 'الإيرباق', 'ضغط الزيت', 'البطارية', 'لا يوجد'] },
    { id: 53, section: 'الأنظمة الكهربائية', name: 'عمل الإضاءات', type: 'checkbox', required: true, options: ['الأنوار الأمامية', 'الأنوار الخلفية', 'أنوار الفرامل', 'الإشارات', 'الفلاشر', 'الأنوار الداخلية'] },
    { id: 54, section: 'أنظمة الأمان', name: 'نظام الوسائد الهوائية (الإيرباق)', type: 'select', required: true, options: ['سليم', 'يوجد خلل', 'لمبة الإيرباق مضاءة', 'غير شغال', 'غير معلوم'] },
    { id: 55, section: 'أنظمة الأمان', name: 'نظام مانع الانزلاق (ABS)', type: 'select', required: true, options: ['يعمل بكفاءة', 'اللمبة مضاءة', 'لا يعمل', 'غير متوفر بالسيارة'] },
    { id: 56, section: 'أنظمة الأمان', name: 'أحزمة الأمان', type: 'select', required: true, options: ['تعمل بالكامل', 'يوجد خلل بسيط', 'تالفة', 'غير موجودة'] },
    { id: 57, section: 'أنظمة الأمان', name: 'معدات الطوارئ', type: 'checkbox', required: true, options: ['طفاية حريق', 'حقيبة إسعافات', 'مثلث طوارئ', 'إطار احتياطي (استبنة)', 'عفريتة', 'لا يوجد'] },
  ],
};

const fallbackTypes = [
  { id: 1, name: 'نموذج البائع', slug: 'seller-form' },
  { id: 2, name: 'فحص المشتري الأساسي', slug: 'buyer-basic-test' },
  { id: 3, name: 'فحص المشتري المتقدم', slug: 'buyer-advanced-test' },
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
  // FIX: Conditionally skip the query if brand_id is not set
  const { data: models = [] } = useGetCarModelsByBrandQuery(
    carForm.brand_id ? Number(carForm.brand_id) : skipToken
  );
  const { data: categories = [] } = useGetCarCategoriesQuery();
  const { data: inspectionTypes = [] } = useGetCarInspectionTypesQuery();
  
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

  const updateCarField = (field: keyof CarFormState, value: string) => {
    setCarForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'brand_id' ? { model_id: '' } : {}), // Reset model_id when brand changes
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
    const missing = templates.filter((field) => field.required && (
      fieldValues[String(field.id)] === undefined ||
      fieldValues[String(field.id)] === '' ||
      (Array.isArray(fieldValues[String(field.id)]) && (fieldValues[String(field.id)] as unknown[]).length === 0)
    ));
    if (missing.length > 0) {
      setFormError(`الرجاء إكمال حقول الفحص الإلزامية: ${missing.map((field) => field.name).slice(0, 3).join('، ')}${missing.length > 3 ? '...' : ''}`);
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
      location: '',
      price: carForm.price ? Number(carForm.price) : undefined,
      country_id: 0 as any,
      state_id: 0 as any,
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
          required={field.required}
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
        required={field.required}
      />
    );
  };

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/manual-examinations')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowRight className="h-4 w-4" /> {/* Changed from ArrowLeft for RTL */}
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
            <ChevronLeft className="h-4 w-4 text-gray-400" /> {/* Changed from ChevronRight for RTL */}
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
                {renderSelect('الموديل', carForm.model_id, (value) => updateCarField('model_id', value), models.map((item) => ({ id: item.id, name: lookupName(item) })))}
                {renderSelect('الفئة', carForm.category_id, (value) => updateCarField('category_id', value), categories.map((item) => ({ id: item.id, name: lookupName(item) })))}
                {renderTextInput('اللون', carForm.color_id, (value) => updateCarField('color_id', value), 'text', true)}
                {renderTextInput('سنة الصنع', carForm.manufacture_year, (value) => updateCarField('manufacture_year', value), 'number', true)}
                {renderTextInput('المسافة المقطوعة', carForm.milage, (value) => updateCarField('milage', value), 'number', true)}
                {renderTextInput('السعر', carForm.price, (value) => updateCarField('price', value), 'number')}
                {renderSelect('نوع الوقود', carForm.fuel_type, (value) => updateCarField('fuel_type', value), [{ id: 'petrol', name: 'بنزين' }, { id: 'diesel', name: 'ديزل' }, { id: 'electric', name: 'كهرباء' }, { id: 'hybrid', name: 'هجين (هايبرد)' }], true)}
                {renderSelect('ناقل الحركة', carForm.transmission, (value) => updateCarField('transmission', value), [{ id: 'automatic', name: 'أوتوماتيك' }, { id: 'manual', name: 'يدوي' }], true)}
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
                <ChevronLeft className="h-4 w-4" /> {/* Changed from ChevronRight for RTL */}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">نوع الفحص</h2>
              {renderSelect('النموذج المستخدم للفحص', inspectionTypeId, setInspectionTypeId, availableInspectionTypes.map((item) => ({ id: item.id, name: item.name })), true)}
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
                              {field.name}{field.required && <span className="text-red-500 mr-1">*</span>}
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
            ))}

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
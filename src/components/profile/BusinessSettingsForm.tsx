import React, { useState, useEffect } from 'react';
import {
  useGetProfileQuery,
  useUpdateBusinessSettingsMutation,
  useGetCountriesQuery,
  useGetStatesByCountryQuery,
  useGetCitiesByStateQuery
} from '../../store/api/profileApi';
import { useTranslation } from '../../hooks/useTranslation';
import type { BusinessSettings } from '../../types/user';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';


const BusinessSettingsForm: React.FC = () => {
  const { data: profileResponse, isLoading, error } = useGetProfileQuery();
  const [updateBusinessSettings, { isLoading: isUpdating, error: updateError }] = useUpdateBusinessSettingsMutation();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<BusinessSettings>({
    shop_name: "",
    description: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
    country_id: undefined,
    state_id: undefined,
    city_id: undefined,
    phone: "",
    email: "",
    service_areas: [],
    specializations: [],
    working_hours: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false },
    },
    hourly_rate: 0,
    travel_radius: 50,
  });

  // Location API queries
  const { data: countriesResponse } = useGetCountriesQuery();
  const { data: statesResponse } = useGetStatesByCountryQuery(formData.country_id!, {
    skip: !formData.country_id,
  });
  const { data: citiesResponse } = useGetCitiesByStateQuery(formData.state_id!, {
    skip: !formData.state_id,
  });


  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (profileResponse?.data?.inspector_profile) {
      const inspectorProfile = profileResponse.data.inspector_profile;
      setFormData(prev => ({
        ...prev,
        shop_name: inspectorProfile.shop_name || "",
        description: inspectorProfile.description || "",
        address: inspectorProfile.inspector_address || "",
        latitude: inspectorProfile.latitude,
        longitude: inspectorProfile.longitude,
        country_id: inspectorProfile.country?.id,
        state_id: inspectorProfile.state?.id,
        city_id: inspectorProfile.city?.id,
        phone: inspectorProfile.inspector_phone || "",
        email: inspectorProfile.inspector_email || "",
        working_hours: inspectorProfile.working_hours || prev.working_hours,
      }));
    }
  }, [profileResponse]);

  const handleInputChange = (field: keyof BusinessSettings, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCountryChange = (countryId: number) => {
    setFormData(prev => ({
      ...prev,
      country_id: countryId,
      state_id: undefined,
      city_id: undefined,
    }));
  };

  const handleStateChange = (stateId: number) => {
    setFormData(prev => ({
      ...prev,
      state_id: stateId,
      city_id: undefined,
    }));
  };





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    try {
      await updateBusinessSettings(formData).unwrap();
      setSuccessMessage(t('profile.messages.businessSettingsUpdated'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update business settings:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={t('profile.messages.failedToLoadBusinessSettings')} />;
  }



  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {t('profile.sections.businessSettings')}
      </h2>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {updateError && (
        <div className="mb-4">
          <ErrorMessage message={t('profile.messages.failedToUpdateBusinessSettings')} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Shop Name */}
        <div>
          <label htmlFor="shop_name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.fields.shopName')}
          </label>
          <input
            type="text"
            id="shop_name"
            value={formData.shop_name}
            onChange={(e) => handleInputChange('shop_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('profile.placeholders.shopName')}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.fields.description')}
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('profile.placeholders.description')}
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.phone')}
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.placeholders.phone')}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.email')}
            </label>
            <input
              type="email"
              id="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.placeholders.email')}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.fields.address')}
          </label>
          <input
            type="text"
            id="address"
            value={formData.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('profile.placeholders.address')}
          />
        </div>

        {/* Location Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.country')}
            </label>
            <select
              id="country"
              value={formData.country_id || ''}
              onChange={(e) => handleCountryChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('profile.placeholders.selectCountry')}</option>
              {countriesResponse?.data?.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.state')}
            </label>
            <select
              id="state"
              value={formData.state_id || ''}
              onChange={(e) => handleStateChange(Number(e.target.value))}
              disabled={!formData.country_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{t('profile.placeholders.selectState')}</option>
              {statesResponse?.data?.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.city')}
            </label>
            <select
              id="city"
              value={formData.city_id || ''}
              onChange={(e) => handleInputChange('city_id', Number(e.target.value))}
              disabled={!formData.state_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{t('profile.placeholders.selectCity')}</option>
              {citiesResponse?.data?.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Picker */}
        

        {/* Coordinates Display/Manual Entry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.latitude')}
            </label>
            <input
              type="number"
              id="latitude"
              step="any"
              value={formData.latitude || ''}
              onChange={(e) => handleInputChange('latitude', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.placeholders.latitude')}
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fields.longitude')}
            </label>
            <input
              type="number"
              id="longitude"
              step="any"
              value={formData.longitude || ''}
              onChange={(e) => handleInputChange('longitude', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.placeholders.longitude')}
            />
          </div>
        </div>

        {/* Working Hours */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {t('profile.fields.workingHours')}
          </label>
          <div className="space-y-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-24">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.working_hours[day]?.enabled || false}
                      onChange={(e) => handleWorkingHoursChange(day, 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                      {getDayTranslation(day)}
                    </span>
                  </label>
                </div>

                {formData.working_hours[day]?.enabled && (
                  <>
                    <div>
                      <input
                        type="time"
                        value={formData.working_hours[day]?.start || '09:00'}
                        onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <span className="text-gray-500">{t('profile.messages.to')}</span>
                    <div>
                      <input
                        type="time"
                        value={formData.working_hours[day]?.end || '17:00'}
                        onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div> */}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? t('profile.actions.updating') : t('profile.actions.updateSettings')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettingsForm;
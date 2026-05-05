import React, { useState } from 'react';
import { useChangePasswordMutation } from '../../store/api/profileApi';
import { useTranslation } from '../../hooks/useTranslation';
import type { PasswordChangeData } from '../../types/user';
import ErrorMessage from '../common/ErrorMessage';

const PasswordChangeForm: React.FC = () => {
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.current_password) {
      errors.current_password = t('profile.validation.currentPasswordRequired');
    }

    if (!formData.new_password) {
      errors.new_password = t('profile.validation.newPasswordRequired');
    } else if (formData.new_password.length < 8) {
      errors.new_password = t('profile.validation.passwordMinLength');
    }

    if (!formData.new_password_confirmation) {
      errors.new_password_confirmation = t('profile.validation.passwordConfirmationRequired');
    } else if (formData.new_password !== formData.new_password_confirmation) {
      errors.new_password_confirmation = t('profile.validation.passwordsDoNotMatch');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      await changePassword(formData).unwrap();
      setSuccessMessage(t('profile.messages.passwordChanged'));
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {t('profile.sections.changePassword')}
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

      {error && (
        <div className="mb-4">
          <ErrorMessage message={t('profile.messages.failedToChangePassword')} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.fields.currentPassword')} *
          </label>
          <input
            type="password"
            id="current_password"
            name="current_password"
            required
            value={formData.current_password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.current_password ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.current_password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.current_password}</p>
          )}
        </div>

        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.fields.newPassword')} *
          </label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            required
            value={formData.new_password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.new_password ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.new_password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.new_password}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {t('profile.validation.passwordMinLengthHint')}
          </p>
        </div>

        <div>
          <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.fields.confirmNewPassword')} *
          </label>
          <input
            type="password"
            id="new_password_confirmation"
            name="new_password_confirmation"
            required
            value={formData.new_password_confirmation}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.new_password_confirmation ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.new_password_confirmation && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.new_password_confirmation}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('profile.actions.changingPassword') : t('profile.actions.changePassword')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
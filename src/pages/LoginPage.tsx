import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Button, Input, ErrorMessage, LoadingSpinner, LanguageSelector } from '../components/common';
import { validateEmail, isEmpty } from '../utils/validation';
import { getTextAlignmentClasses, getPositionClasses } from '../utils/directionUtils';
import type { LoginCredentials } from '../types';
import Logo from '../assets/samh.svg';
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { t, isRTL } = useTranslation();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear general error when user starts typing
  useEffect(() => {
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  }, [formData.email, formData.password]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (isEmpty(formData.email)) {
      newErrors.email = t('auth.login.validation.emailRequired');
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) {
        newErrors.email = t('auth.login.validation.invalidEmail');
      }
    }

    // Password validation
    if (isEmpty(formData.password)) {
      newErrors.password = t('auth.login.validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData);

      if (!result.success) {
        setErrors({ general: result.error || t('auth.login.errors.loginFailed') });
      }
    } catch (error) {
      setErrors({ general: t('auth.login.errors.unexpectedError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Language Selector - positioned at top corner (right for LTR, left for RTL) */}
      <div className={`absolute top-4 z-10 ${getPositionClasses(false, '4', 'end')}`}>
        <LanguageSelector showText={false} placement="modal" />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto w-[50%] flex items-center justify-center">
            <img
              className="h-[50px] w-100"
              src={Logo}
            />

          </div>
          <h2 className={`mt-6 text-3xl font-extrabold text-gray-900 ${getTextAlignmentClasses(isRTL, 'center')}`}>
            {t('auth.login.title')}
          </h2>
          <p className={`mt-2 text-sm text-gray-600 ${getTextAlignmentClasses(isRTL, 'center')}`}>
            {t('auth.login.subtitle')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
            {errors.general && (
              <ErrorMessage message={errors.general} />
            )}

            <div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                label={t('auth.login.emailLabel')}
                placeholder={t('auth.login.emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                label={t('auth.login.passwordLabel')}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full cursor-pointer"
                disabled={isFormDisabled}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t('auth.login.signingIn')}
                  </div>
                ) : (
                  t('auth.login.signInButton')
                )}
              </Button>
            </div>

            <div className={getTextAlignmentClasses(isRTL, 'center')}>
              <p className="text-sm text-gray-600">
                {t('auth.login.troubleText')}{' '}
                <a
                  href="mailto:support@example.com"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t('auth.login.contactSupport')}
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
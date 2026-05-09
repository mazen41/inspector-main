import React, { useState, useRef } from 'react';
import { useGetProfileQuery, useUploadCoverPhotoMutation } from '../../store/api/profileApi';
import { useTranslation } from '../../hooks/useTranslation';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const CoverPhotoUpload: React.FC = () => {
  const { data: profileResponse } = useGetProfileQuery();
  const [uploadCoverPhoto, { isLoading: isUploading, error: uploadError }] = useUploadCoverPhotoMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('profile.messages.selectImageFile'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('profile.messages.fileSizeLimit'));
      return;
    }

    try {
      await uploadCoverPhoto(file).unwrap();
      setSuccessMessage(t('profile.messages.coverPhotoUploaded'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to upload cover photo:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const profile = profileResponse?.data;
  const coverPhotoUrl = profile?.inspector_profile?.banner_image;
  const shopName = profile?.shop_name || profile?.inspector_profile?.shop_name || 'Center';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {t('profile.sections.coverPhoto')}
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

      {uploadError && (
        <div className="mb-4">
          <ErrorMessage message={t('profile.messages.failedToUploadCoverPhoto')} />
        </div>
      )}

      <div className="space-y-4">
        {/* Cover Photo Preview */}
        <div className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50" style={{ aspectRatio: '3/1' }}>
          {coverPhotoUrl ? (
            <img
              src={coverPhotoUrl}
              alt={`${shopName} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">{t('profile.messages.noCoverPhoto')}</p>
              <p className="text-xs mt-1">{t('profile.messages.coverPhotoRecommendation')}</p>
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('profile.messages.coverPhotoRecommendation')}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleFileSelect}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? t('profile.actions.uploading') : coverPhotoUrl ? t('profile.actions.changeCoverPhoto') : t('profile.actions.uploadCoverPhoto')}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default CoverPhotoUpload;

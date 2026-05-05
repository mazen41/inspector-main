import React, { useState, useRef } from 'react';
import { useGetProfileQuery, useUploadAvatarMutation } from '../../store/api/profileApi';
import { getInitials } from '../../utils/format';
import { useTranslation } from '../../hooks/useTranslation';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const AvatarUpload: React.FC = () => {
  const { data: profileResponse } = useGetProfileQuery();
  const [uploadAvatar, { isLoading: isUploading, error: uploadError }] = useUploadAvatarMutation();
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
      await uploadAvatar(file).unwrap();
      setSuccessMessage(t('profile.messages.avatarUploaded'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const profile = profileResponse?.data;
  const avatarUrl = profile?.inspector_profile?.image;
  const userName = profile?.shop_name || 'User';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {t('profile.sections.profilePicture')}
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
          <ErrorMessage message={t('profile.messages.failedToUploadAvatar')} />
        </div>
      )}

      <div className="flex items-center space-x-6">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-gray-600">
                {getInitials(userName)}
              </span>
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userName}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('profile.messages.avatarRecommendation')}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleFileSelect}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? t('profile.actions.uploading') : t('profile.actions.uploadNewPicture')}
            </button>
            
            {avatarUrl && (
              <button
                onClick={() => {
                  // This would need to be implemented in the API
                  console.log('Remove avatar functionality would go here');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {t('profile.actions.remove')}
              </button>
            )}
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

export default AvatarUpload;
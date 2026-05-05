import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Plus } from 'lucide-react';

interface PhotoUploadButtonProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
  photoCount?: number;
  maxPhotos?: number;
}

const PhotoUploadButton: React.FC<PhotoUploadButtonProps> = ({
  onUpload,
  disabled = false,
  isUploading = false,
  photoCount = 0,
  maxPhotos = 10,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const isAtMaxPhotos = photoCount >= maxPhotos;
  const showButtons = !disabled && !isAtMaxPhotos;

  return (
    <div className="photo-upload-button">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {photoCount === 0 ? (
        // Initial upload state - larger area with mobile optimization
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`bg-gray-100 rounded-full ${isMobile ? 'p-4' : 'p-3'}`}>
              <Camera className={`text-gray-400 ${isMobile ? 'h-10 w-10' : 'h-8 w-8'}`} />
            </div>
          </div>
          
          <div>
            <p className={`text-gray-600 font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>
              Add photos to document this field
            </p>
            <p className={`text-gray-500 mt-1 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              {isMobile 
                ? 'Use the buttons below to add photos'
                : 'Use the buttons below to add photos'
              }
            </p>
          </div>

          {showButtons && (
            <div className={`flex justify-center gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={isUploading}
                className={`
                  flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg 
                  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${isMobile 
                    ? 'w-full px-6 py-4 text-base min-h-[52px]' 
                    : 'px-4 py-3 text-sm'
                  }
                `}
              >
                <Upload className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                {isUploading ? 'Uploading...' : 'Browse Files'}
              </button>
              
              {/* Camera button - show on mobile or devices with camera */}
              {(isMobile || 'mediaDevices' in navigator) && (
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={isUploading}
                  className={`
                    flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg 
                    hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                    ${isMobile 
                      ? 'w-full px-6 py-4 text-base min-h-[52px]' 
                      : 'px-4 py-3 text-sm'
                    }
                  `}
                >
                  <Camera className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                  Take Photo
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Compact state when photos exist - mobile optimized
        <div className={`flex items-center justify-between ${isMobile ? 'py-2' : ''}`}>
          <div className={`text-gray-600 font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
            {photoCount} of {maxPhotos} photos
          </div>

          {showButtons && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={isUploading}
                className={`
                  flex items-center gap-1 bg-blue-600 text-white rounded-lg 
                  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${isMobile 
                    ? 'px-4 py-3 text-sm min-h-[44px]' 
                    : 'px-3 py-2 text-xs'
                  }
                `}
                title="Add more photos"
              >
                <Plus className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
                {isMobile ? 'Add' : 'Add'}
              </button>
              
              {(isMobile || 'mediaDevices' in navigator) && (
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={isUploading}
                  className={`
                    flex items-center gap-1 bg-green-600 text-white rounded-lg 
                    hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                    ${isMobile 
                      ? 'px-4 py-3 text-sm min-h-[44px]' 
                      : 'px-3 py-2 text-xs'
                    }
                  `}
                  title="Take photo"
                >
                  <Camera className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
                  {isMobile ? '' : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isAtMaxPhotos && !disabled && (
        <div className="text-center mt-3">
          <p className={`text-amber-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>
            Maximum {maxPhotos} photos reached
          </p>
        </div>
      )}

      {disabled && photoCount === 0 && (
        <div className="text-center">
          <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-sm'}`}>
            Photo upload disabled
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadButton;
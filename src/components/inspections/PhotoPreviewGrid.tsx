import React, { useState, useEffect } from 'react';
import { X, Eye, Trash2 } from 'lucide-react';
import type { InspectionPhoto } from '../../types/inspection';
import { buildAssetUrl } from '../../utils/assetUrl';

interface PhotoPreviewGridProps {
  photos: (InspectionPhoto & { fieldName?: string })[];
  onPhotoClick: (photo: InspectionPhoto) => void;
  onPhotoDelete: (photoId: number) => void;
  readOnly?: boolean;
}

const PhotoPreviewGrid: React.FC<PhotoPreviewGridProps> = ({
  photos,
  onPhotoClick,
  onPhotoDelete,
  readOnly = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [touchedPhoto, setTouchedPhoto] = useState<number | null>(null);

  // Detect mobile device and screen size
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

  if (photos.length === 0) {
    return null;
  }

  const formatUploadDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handlePhotoTouch = (photoId: number) => {
    setTouchedPhoto(photoId);
    // Clear touch state after a delay
    setTimeout(() => setTouchedPhoto(null), 2000);
  };

  const getGridColumns = () => {
    if (isMobile) {
      return photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
    }
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
  };

  return (
    <div className="photo-preview-grid">
      <div className={`grid ${getGridColumns()} gap-3`}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`
              relative bg-gray-100 rounded-lg overflow-hidden aspect-square
              ${isMobile ? 'group' : 'group hover:shadow-lg'}
              transition-all duration-200
            `}
            onTouchStart={isMobile ? () => handlePhotoTouch(photo.id) : undefined}
          >
            {/* Photo Thumbnail */}
            <img
              src={buildAssetUrl(photo.thumbnail_url || photo.url)}
              alt={photo.caption || 'Inspection photo'}
              className={`
                w-full h-full object-cover cursor-pointer transition-transform duration-200
                ${isMobile ? 'active:scale-95' : 'group-hover:scale-105'}
              `}
              onClick={() => onPhotoClick(photo)}
              loading="lazy"
            />

            {/* Mobile-optimized overlay with actions */}
            <div className={`
              absolute inset-0 transition-all duration-200 flex items-center justify-center
              ${isMobile 
                ? (touchedPhoto === photo.id ? 'bg-black opacity-40' : 'bg-black opacity-0')
                : 'bg-black opacity-0 group-hover:opacity-40'
              }
            `}>
              <div className={`
                transition-opacity duration-200 flex gap-3
                ${isMobile 
                  ? (touchedPhoto === photo.id ? 'opacity-100' : 'opacity-0')
                  : 'opacity-0 group-hover:opacity-100'
                }
              `}>
                {/* View button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoClick(photo);
                  }}
                  className={`
                    p-3 bg-white opacity-90 rounded-full hover:opacity-100 
                    transition-all active:scale-95
                    ${isMobile ? 'min-h-[48px] min-w-[48px]' : 'p-2'}
                  `}
                  title="View photo"
                >
                  <Eye className={`text-gray-700 ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                </button>

                {/* Delete button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobile) {
                        // Show confirmation on mobile
                        if (confirm('Delete this photo?')) {
                          onPhotoDelete(photo.id);
                        }
                      } else {
                        onPhotoDelete(photo.id);
                      }
                    }}
                    className={`
                      p-3 bg-red-600 opacity-90 rounded-full hover:opacity-100 
                      transition-all active:scale-95
                      ${isMobile ? 'min-h-[48px] min-w-[48px]' : 'p-2'}
                    `}
                    title="Delete photo"
                  >
                    <Trash2 className={`text-white ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile-specific delete button in corner */}
            {isMobile && !readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this photo?')) {
                    onPhotoDelete(photo.id);
                  }
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-600 opacity-80 rounded-full active:scale-95 transition-all"
                title="Delete photo"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}

            {/* Photo info overlay - responsive */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
              <div className={`text-white ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {photo.fieldName && (
                  <div className="font-medium text-blue-200 truncate mb-1">
                    {photo.fieldName}
                  </div>
                )}
                {photo.caption && (
                  <div className="font-medium truncate mb-1">
                    {photo.caption}
                  </div>
                )}
                {photo.uploaded_at && ( <div className="opacity-75">
                  {formatUploadDate(photo.uploaded_at)}
                </div>
                )}
              </div>
            </div>

            {/* Loading state for new uploads */}
            {!photo.url && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  Uploading...
                </div>
              </div>
            )}

            {/* Touch indicator for mobile */}
            {isMobile && (
              <div className="absolute top-2 left-2 opacity-60">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo count summary - responsive */}
      <div className={`mt-3 text-center ${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>
        {photos.length} photo{photos.length !== 1 ? 's' : ''}
        {isMobile && photos.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            Tap photos to view • Long press for options
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPreviewGrid;
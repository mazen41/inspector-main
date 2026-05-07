import React, { useState, useEffect } from 'react';
import { X, Eye, Trash2 } from 'lucide-react';
import type { InspectionPhoto } from '../../types/inspection';

interface FieldPhotoPreviewProps {
    photos: InspectionPhoto[];
    onPhotoClick: (photo: InspectionPhoto) => void;
    onPhotoDelete: (photoId: number) => void;
    readOnly?: boolean;
    maxPreviewPhotos?: number;
    forceArabic?: boolean;
}

const FieldPhotoPreview: React.FC<FieldPhotoPreviewProps> = ({
    photos,
    onPhotoClick,
    onPhotoDelete,
    readOnly = false,
    maxPreviewPhotos = 8,
    forceArabic = false,
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

    const formatUploadDate = (dateString?: string) => {
        if (!dateString) return forceArabic ? 'تاريخ غير معروف' : 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(forceArabic ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return forceArabic ? 'تاريخ غير معروف' : 'Unknown date';
        }
    };

    const handlePhotoTouch = (photoId: number) => {
        setTouchedPhoto(photoId);
        // Clear touch state after a delay
        setTimeout(() => setTouchedPhoto(null), 2000);
    };

    // Show only the first few photos, with an indicator if there are more
    const displayPhotos = photos.slice(0, maxPreviewPhotos);
    const hasMorePhotos = photos.length > maxPreviewPhotos;

    return (
        <div className="field-photo-preview mt-3">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">
                    {forceArabic ? `${photos.length} صور` : `${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
                </div>
                {hasMorePhotos && (
                    <div className="text-xs text-gray-500">
                        {forceArabic ? `عرض ${maxPreviewPhotos} من ${photos.length}` : `Showing ${maxPreviewPhotos} of ${photos.length}`}
                    </div>
                )}
            </div>

            <div className={`grid gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3`}>
                {displayPhotos.map((photo, index) => {
                    if (!photo) return null;

                    return (
                        <div
                            key={photo.id}
                            className={`
              relative bg-gray-100 rounded-lg overflow-hidden aspect-square
              ${isMobile ? 'group' : 'group hover:shadow-md'}
              transition-all duration-200
             'max-w-64 max-h-64'
            `}
                            onTouchStart={isMobile ? () => handlePhotoTouch(photo?.id) : undefined}
                        >
                            {/* Photo Thumbnail */}
                            {photo?.url || photo?.thumbnail_url ? (
                                <img
                                    src={photo.thumbnail_url || photo.url}
                                    alt={photo.caption || (forceArabic ? `صورة ${index + 1}` : `Photo ${index + 1}`)}
                                    className={`
                  w-full h-full object-cover cursor-pointer transition-transform duration-200
                  ${isMobile ? 'active:scale-95' : 'group-hover:scale-105'}
                `}
                                    onClick={() => onPhotoClick(photo)}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <div className="text-gray-500 text-xs text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-1"></div>
                                        {forceArabic ? 'جار الرفع...' : 'Uploading...'}
                                    </div>
                                </div>
                            )}

                            {/* Overlay with actions */}
                            <div className={`
              absolute inset-0 transition-all duration-200 flex items-center justify-center
              ${isMobile
                                    ? (touchedPhoto === photo?.id ? 'bg-black opacity-40' : 'bg-black opacity-0')
                                    : 'bg-black opacity-0 group-hover:opacity-40'
                                }
            `}>
                                <div className={`
                transition-opacity duration-200 flex gap-2
                ${isMobile
                                        ? (touchedPhoto === photo?.id ? 'opacity-100' : 'opacity-0')
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
                    p-2 bg-white opacity-90 rounded-full hover:opacity-100 
                    transition-all active:scale-95
                    ${isMobile ? 'min-h-[40px] min-w-[40px]' : ''}
                  `}
                                        title={forceArabic ? 'عرض الصورة' : 'View photo'}
                                    >
                                        <Eye className={`text-gray-700 ${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                    </button>

                                    {/* Delete button */}
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isMobile) {
                                                    // Show confirmation on mobile
                                                    if (confirm(forceArabic ? 'هل تريد حذف هذه الصورة؟' : 'Delete this photo?')) {
                                                        onPhotoDelete(photo?.id);
                                                    }
                                                } else {
                                                    onPhotoDelete(photo?.id);
                                                }
                                            }}
                                            className={`
                      p-2 bg-red-600 opacity-90 rounded-full hover:opacity-100 
                      transition-all active:scale-95
                      ${isMobile ? 'min-h-[40px] min-w-[40px]' : ''}
                    `}
                                            title={forceArabic ? 'حذف الصورة' : 'Delete photo'}
                                        >
                                            <Trash2 className={`text-white ${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
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
                                        if (confirm(forceArabic ? 'هل تريد حذف هذه الصورة؟' : 'Delete this photo?')) {
                                            onPhotoDelete(photo?.id);
                                        }
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-red-600 opacity-80 rounded-full active:scale-95 transition-all"
                                    title={forceArabic ? 'حذف الصورة' : 'Delete photo'}
                                >
                                    <X className="h-3 w-3 text-white" />
                                </button>
                            )}

                            {/* Photo info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1">
                                <div className="text-white text-xs">
                                    {photo?.caption && (
                                        <div className="font-medium truncate mb-0.5">
                                            {photo.caption}
                                        </div>
                                    )}
                                    {photo?.uploaded_at && (
                                        <div className="opacity-75 text-xs">
                                            {formatUploadDate(photo?.uploaded_at)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Loading state for new uploads */}
                            {!photo?.url && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                    <div className="text-gray-500 text-xs">
                                        {forceArabic ? 'جار الرفع...' : 'Uploading...'}
                                    </div>
                                </div>
                            )}

                            {/* Show "+X more" indicator on the last photo if there are more */}
                            {hasMorePhotos && index === maxPreviewPhotos - 1 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                    <div className="text-white text-sm font-medium">
                                        {forceArabic ? `+${photos.length - maxPreviewPhotos} أخرى` : `+${photos.length - maxPreviewPhotos} more`}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile instruction */}
            {isMobile && photos.length > 0 && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                    {forceArabic ? 'اضغط على الصور للعرض، واضغط مطولا للخيارات' : 'Tap photos to view - Long press for options'}
                </div>
            )}
        </div>
    );
};

export default FieldPhotoPreview;

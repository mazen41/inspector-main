import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Download, ZoomIn, ZoomOut } from 'lucide-react';
import type { InspectionPhoto } from '../../types/inspection';

interface PhotoModalProps {
  photos: (InspectionPhoto & { fieldName?: string })[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: number) => void;
  readOnly?: boolean;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onDelete,
  readOnly = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

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

  // Update active index when currentIndex prop changes
  useEffect(() => {
    setActiveIndex(currentIndex);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Auto-hide controls on mobile after inactivity
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMobile, isOpen, activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Delete':
          if (!readOnly && onDelete && photos[activeIndex]) {
            e.preventDefault();
            handleDelete();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, photos, readOnly, onDelete, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setIsLoading(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setIsLoading(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [photos.length]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setShowControls(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Only handle horizontal swipes if not zoomed
    if (zoomLevel === 1 && !isVerticalSwipe) {
      if (isLeftSwipe && photos.length > 1) {
        goToNext();
      } else if (isRightSwipe && photos.length > 1) {
        goToPrevious();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, photos.length, zoomLevel, goToNext, goToPrevious]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setImagePosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleImageClick = useCallback(() => {
    if (isMobile) {
      setShowControls(prev => !prev);
    }
  }, [isMobile]);

  const handleDelete = useCallback(() => {
    const photo = photos[activeIndex];
    if (!photo || !onDelete) return;

    if (confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id);
      
      // Navigate to next photo or close modal if this was the last one
      if (photos.length === 1) {
        onClose();
      } else if (activeIndex === photos.length - 1) {
        setActiveIndex(activeIndex - 1);
      }
    }
  }, [photos, activeIndex, onDelete, onClose]);

  const handleDownload = useCallback(() => {
    const photo = photos[activeIndex];
    if (!photo) return;

    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `inspection-photo-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [photos, activeIndex]);

  const formatUploadDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (!isOpen || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[activeIndex];
  if (!currentPhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Modal Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header - responsive */}
        <div className={`
          absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent
          transition-all duration-300
          ${isMobile && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          ${isMobile ? 'p-3' : 'p-4'}
        `}>
          <div className="flex items-center justify-between text-white">
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
              <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                {activeIndex + 1} of {photos.length}
              </h3>
              {!isMobile && (
                <div className="flex flex-col gap-1">
                  {currentPhoto.fieldName && (
                    <span className="text-blue-300 text-sm font-medium">
                      Field: {currentPhoto.fieldName}
                    </span>
                  )}
                  {currentPhoto.caption && (
                    <span className="text-gray-300 text-sm">
                      {currentPhoto.caption}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom controls for mobile */}
              {isMobile && (
                <>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-50"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-50"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Download button */}
              <button
                onClick={handleDownload}
                className={`hover:bg-white hover:bg-opacity-20 rounded-full transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                title="Download photo"
              >
                <Download className="h-5 w-5" />
              </button>

              {/* Delete button */}
              {!readOnly && onDelete && (
                <button
                  onClick={handleDelete}
                  className={`hover:bg-red-600 hover:bg-opacity-80 rounded-full transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                  title="Delete photo"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className={`hover:bg-white hover:bg-opacity-20 rounded-full transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                title="Close"
              >
                <X className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Image Area */}
        <div 
          className={`flex-1 flex items-center justify-center overflow-hidden ${isMobile ? 'p-2 pt-16 pb-20' : 'p-4 pt-20 pb-16'}`}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          <div className="relative max-w-full max-h-full">
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {/* Main image */}
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || `Inspection photo ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                cursor: isMobile ? 'pointer' : 'default',
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              onClick={handleImageClick}
              draggable={false}
            />

            {/* Navigation arrows - desktop only or when controls are visible on mobile */}
            {photos.length > 1 && (!isMobile || showControls) && (
              <>
                <button
                  onClick={goToPrevious}
                  className={`
                    absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 
                    hover:bg-opacity-70 text-white rounded-full transition-all
                    ${isMobile ? 'p-4' : 'p-3'}
                  `}
                  title="Previous photo"
                >
                  <ChevronLeft className={isMobile ? 'h-8 w-8' : 'h-6 w-6'} />
                </button>

                <button
                  onClick={goToNext}
                  className={`
                    absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 
                    hover:bg-opacity-70 text-white rounded-full transition-all
                    ${isMobile ? 'p-4' : 'p-3'}
                  `}
                  title="Next photo"
                >
                  <ChevronRight className={isMobile ? 'h-8 w-8' : 'h-6 w-6'} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer - responsive */}
        <div className={`
          absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent
          transition-all duration-300
          ${isMobile && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          ${isMobile ? 'p-3' : 'p-4'}
        `}>
          <div className="text-white text-center">
            {/* Mobile photo info */}
            {isMobile && (
              <div className="mb-3 text-sm">
                {currentPhoto.fieldName && (
                  <div className="text-blue-300 font-medium mb-1">
                    Field: {currentPhoto.fieldName}
                  </div>
                )}
                {currentPhoto.caption && (
                  <div className="text-gray-300 mb-1">
                    {currentPhoto.caption}
                  </div>
                )}
              </div>
            )}

            <div className={`text-gray-300 ${isMobile ? 'text-sm' : 'text-sm'}`}>
              Uploaded {formatUploadDate(currentPhoto.uploaded_at)}
            </div>
            
            {/* Thumbnail navigation - responsive */}
            {photos.length > 1 && (
              <div className={`
                flex justify-center gap-2 mt-3 overflow-x-auto pb-2
                ${isMobile ? 'px-4' : ''}
              `}>
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setActiveIndex(index);
                      setIsLoading(true);
                      setZoomLevel(1);
                      setImagePosition({ x: 0, y: 0 });
                    }}
                    className={`
                      flex-shrink-0 rounded border-2 overflow-hidden transition-all
                      ${isMobile ? 'w-16 h-16' : 'w-12 h-12'}
                      ${index === activeIndex 
                        ? 'border-white shadow-lg' 
                        : 'border-gray-500 hover:border-gray-300 opacity-70 hover:opacity-100'
                      }
                    `}
                  >
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Mobile swipe hint */}
            {isMobile && photos.length > 1 && (
              <div className="text-xs text-gray-400 mt-2">
                Swipe left or right to navigate • Tap to show/hide controls
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close - desktop only */}
        {!isMobile && (
          <div
            className="absolute inset-0 -z-10"
            onClick={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default PhotoModal;
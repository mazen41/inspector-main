import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { useResponsive } from '../../hooks/useAccessibility';
import { useTranslation } from '../../hooks/useTranslation';

interface LayoutProps {
  children: React.ReactNode;
  showBreadcrumb?: boolean;
  pageTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showBreadcrumb = true,
  pageTitle 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();
  const { isRTL } = useTranslation();

  // Close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
          }
        }}
      >
        Skip to main content
      </a>

      <Header 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={toggleSidebar}
        />
        
        <main 
          id="main-content"
          className={`flex-1 pt-16 focus:outline-none ${
            isRTL ? 'lg:mr-64' : 'lg:ml-64'
          }`}
          tabIndex={-1}
          role="main"
          aria-label={pageTitle ? `${pageTitle} content` : 'Main content'}
        >
          <div className="container-responsive py-4 sm:py-6">
            {showBreadcrumb && (
              <div className={`mb-4 sm:mb-6 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                <Breadcrumb />
              </div>
            )}
            
            <div className="max-w-7xl mx-auto">
              {/* Page title for screen readers */}
              {pageTitle && (
                <h1 className="sr-only">
                  {pageTitle}
                </h1>
              )}
              
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
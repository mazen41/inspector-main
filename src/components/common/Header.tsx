import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';
import { buildPublicAssetUrl } from '../../utils/assetUrl';
interface HeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { isRTL, t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and mobile menu button (RTL: Right side) */}
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onMenuToggle}
            >
              <span className="sr-only">{t('common.buttons.openSidebar')}</span>
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <div className={`flex items-center ${isRTL ? 'mr-4 lg:mr-0' : 'ml-4 lg:ml-0'}`}>
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                  <img
                    className="h-[50px] w-100"
                    src={buildPublicAssetUrl('assets/img/logo.png')}
                  />
                </div>
              </div>
              <h1 className={`text-xl font-semibold text-gray-900 hidden sm:block ${isRTL ? 'mr-3' : 'ml-3'
                }`}>
                {t('common.appName')}
              </h1>
            </div>
          </div>

          {/* Right side - Language selector, User menu and notifications (RTL: Left side) */}
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            {/* Language Selector */}
            <LanguageSelector className="hidden sm:block ml-2" />

            {/* Notifications */}
            {/* <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
            </button> */}

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <span className="sr-only">{t('common.buttons.openUserMenu')}</span>
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm font-medium text-gray-700 hidden md:block ${isRTL ? 'mr-2' : 'ml-2'
                    }`}>
                    {user.name}
                  </span>
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />

                    {/* Menu */}
                    <div className={`absolute mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200 ${isRTL ? 'left-0' : 'right-0'
                      }`}>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>


                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                        {t('common.buttons.signOut')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
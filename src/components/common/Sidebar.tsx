import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ClipboardCheck,
  CreditCard, 
  User
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const getNavigation = (t: (key: string) => string, canManualExamination: boolean): NavigationItem[] => {
  const items: NavigationItem[] = [
    { 
      name: t('navigation.dashboard'), 
      href: ROUTES.DASHBOARD, 
      icon: LayoutDashboard,
      description: t('navigation.dashboardDescription')
    },
    { 
      name: t('navigation.inspections'), 
      href: ROUTES.INSPECTIONS, 
      icon: ClipboardList,
      description: t('navigation.inspectionsDescription')
    },
  ];

  if (canManualExamination) {
    items.push({
      name: t('navigation.manualExaminations'),
      href: ROUTES.MANUAL_EXAMINATIONS,
      icon: ClipboardCheck,
      description: t('navigation.manualExaminationsDescription')
    });
  }

  items.push(
    { 
      name: t('navigation.payments'), 
      href: ROUTES.PAYMENTS, 
      icon: CreditCard,
      description: t('navigation.paymentsDescription')
    },
    { 
      name: t('navigation.profile'), 
      href: ROUTES.PROFILE, 
      icon: User,
      description: t('navigation.profileDescription')
    },
  );

  return items;
};

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isRTL, t } = useTranslation();
  const canManualExamination = user?.inspector?.permissions?.can_manual_examination !== false;
  const navigation = getNavigation(t, canManualExamination);

  // Check if current route matches navigation item
  const isActiveRoute = (href: string): boolean => {
    if (href === ROUTES.DASHBOARD) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 z-40 w-64 bg-white shadow-lg pt-16 transform transition-transform duration-300 ease-in-out
        ${isRTL ? 'right-0' : 'left-0'}
        ${isOpen 
          ? 'translate-x-0' 
          : isRTL 
            ? 'translate-x-full' 
            : '-translate-x-full'
        }
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* User info section */}
          {user && (
            <div className="px-4 py-4 border-b border-gray-200">
              <div className={`flex items-center `}>
                <div className="flex-shrink-0">
                  {user.inspector?.image_url ? (
                    <img
                      src={user.inspector.image_url}
                      alt={user.inspector?.shop_name || user.name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className={isRTL ? 'mr-3' : 'ml-3'}>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.inspector?.shop_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${isRTL ? 'flex-row-reverse' : ''}
                    ${isActive
                      ? `bg-blue-50 text-blue-700 ${
                          isRTL ? 'border-l-2 border-blue-700' : 'border-r-2 border-blue-700'
                        }`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => {
                    // Close mobile sidebar when navigating
                    if (window.innerWidth < 1024 && onToggle) {
                      onToggle();
                    }
                  }}
                >
                  <item.icon className={`
                    h-5 w-5 flex-shrink-0 transition-colors
                    ${isRTL ? 'ml-3' : 'mr-3'}
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm font-medium">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {t('common.appVersion')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import clsx from 'clsx';
import { ROUTES } from '../../utils/constants';
import { useTranslation } from '../../hooks/useTranslation';

interface BreadcrumbItem {
  label?: string;
  labelKey?: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();
  const { t, isRTL } = useTranslation();

  // Generate breadcrumb items based on current route if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { labelKey: 'navigation.dashboard', href: ROUTES.DASHBOARD }
    ];

    // Map route segments to translation keys
    const routeLabelKeys: Record<string, string> = {
      'inspections': 'navigation.inspections',
      'payments': 'navigation.payments',
      'profile': 'navigation.profile',
    };

    pathSegments.forEach((segment, index) => {
      if (segment === 'dashboard') return; // Skip dashboard as it's already added

      const isLast = index === pathSegments.length - 1;
      const labelKey = routeLabelKeys[segment];
      
      if (isLast) {
        breadcrumbs.push({ 
          labelKey: labelKey || undefined,
          label: labelKey ? undefined : segment,
          isActive: true 
        });
      } else {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        breadcrumbs.push({ 
          labelKey: labelKey || undefined,
          label: labelKey ? undefined : segment,
          href 
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs for single-level pages
  }

  const getItemLabel = (item: BreadcrumbItem): string => {
    if (item.labelKey) return t(item.labelKey);
    return item.label || '';
  };

  return (
    <nav className={clsx(
      'flex items-center text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-hidden',
      isRTL ? 'space-x-reverse space-x-1 sm:space-x-2' : 'space-x-1 sm:space-x-2'
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      <Home className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className={clsx(
              'h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0',
              isRTL && 'rotate-180'
            )} />
          )}
          
          {item.isActive || !item.href ? (
            <span className="text-gray-900 font-medium truncate min-w-0">
              {getItemLabel(item)}
            </span>
          ) : (
            <Link
              to={item.href}
              className="hover:text-gray-900 transition-colors truncate min-w-0"
            >
              {getItemLabel(item)}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;